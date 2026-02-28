from __future__ import annotations

import ipaddress
import socket
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from time import monotonic
from typing import Any, Iterable, Mapping, Optional, cast
from urllib.parse import urljoin, urlparse, urlunparse

import extruct
import httpx
import yt_dlp
from fastapi import HTTPException
from lxml import html as lxml_html
from lxml.etree import ParserError
from yt_dlp.utils import DownloadError

from app.core.config import settings
from app.model.items import LinkPreviewResponse


ALLOWED_SCHEMES = {"http", "https"}
MAX_TITLE_LENGTH = 300
MAX_DESCRIPTION_LENGTH = 2_000
MAX_SITE_NAME_LENGTH = 120


@dataclass(slots=True)
class _CacheEntry:
    payload: dict[str, Any]
    expires_at: float


class LinkPreviewService:
    def __init__(self) -> None:
        self._cache: dict[str, _CacheEntry] = {}
        self._cache_lock = Lock()

    def get_preview(self, *, item_id: int, raw_url: str) -> LinkPreviewResponse:
        normalized_url = self._normalize_input_url(raw_url)
        cached_payload = self._get_cached_payload(normalized_url)
        if cached_payload is not None:
            return self._build_response_payload(
                item_id=item_id,
                payload=cached_payload,
                cache_hit=True,
            )

        extruct_error: Optional[HTTPException] = None
        ytdlp_error: Optional[HTTPException] = None

        final_url = normalized_url
        extruct_preview: dict[str, Optional[str]] = {}
        try:
            final_url, extruct_preview = self._extract_with_extruct(normalized_url)
        except HTTPException as exc:
            extruct_error = exc

        ytdlp_preview: dict[str, Optional[str]] = {}
        should_try_ytdlp = self._should_try_ytdlp(
            normalized_url=normalized_url,
            extruct_preview=extruct_preview,
        )
        if should_try_ytdlp:
            try:
                ytdlp_preview = self._extract_with_ytdlp(final_url)
            except HTTPException as exc:
                ytdlp_error = exc

        merged_payload = self._merge_preview_data(
            normalized_url=normalized_url,
            final_url=final_url,
            extruct_preview=extruct_preview,
            ytdlp_preview=ytdlp_preview,
        )

        if not self._has_preview_data(merged_payload):
            if extruct_error and (not should_try_ytdlp or ytdlp_error):
                raise extruct_error
            if ytdlp_error:
                raise ytdlp_error

        self._set_cached_payload(normalized_url, merged_payload)
        return self._build_response_payload(
            item_id=item_id,
            payload=merged_payload,
            cache_hit=False,
        )

    def _extract_with_extruct(self, url: str) -> tuple[str, dict[str, Optional[str]]]:
        self._ensure_public_host(url, status_code=422)

        final_url, content, encoding, content_type = self._fetch_html(url)
        self._ensure_public_host(final_url, status_code=502)

        if not self._is_html_content_type(content_type):
            raise HTTPException(
                status_code=502,
                detail="La URL no devolvio contenido HTML para construir la preview.",
            )

        html = self._decode_html(content, encoding)
        metadata = self._run_extruct(html=html, base_url=final_url)

        og_data = self._extract_og_metadata(
            metadata.get("opengraph", []), base_url=final_url
        )
        jsonld_data = self._extract_structured_metadata(
            metadata.get("json-ld", []), base_url=final_url
        )
        microdata_data = self._extract_structured_metadata(
            metadata.get("microdata", []),
            base_url=final_url,
        )
        rdfa_data = self._extract_rdfa_metadata(
            metadata.get("rdfa", []), base_url=final_url
        )
        html_fallback = self._extract_html_fallback(html=html, base_url=final_url)

        preview = {
            "title": self._first_non_empty(
                og_data.get("title"),
                jsonld_data.get("title"),
                microdata_data.get("title"),
                rdfa_data.get("title"),
                html_fallback.get("title"),
            ),
            "description": self._first_non_empty(
                og_data.get("description"),
                jsonld_data.get("description"),
                microdata_data.get("description"),
                rdfa_data.get("description"),
                html_fallback.get("description"),
            ),
            "image": self._first_non_empty(
                og_data.get("image"),
                jsonld_data.get("image"),
                microdata_data.get("image"),
                rdfa_data.get("image"),
            ),
            "site_name": self._first_non_empty(
                og_data.get("site_name"),
                jsonld_data.get("site_name"),
                microdata_data.get("site_name"),
                rdfa_data.get("site_name"),
            ),
        }

        og_url = og_data.get("final_url")
        if og_url:
            final_url = og_url

        return final_url, preview

    def _extract_with_ytdlp(self, url: str) -> dict[str, Optional[str]]:
        if not settings.LINK_PREVIEW_YTDLP_ENABLED:
            return {}

        if not self._is_ytdlp_domain_allowed(url):
            return {}

        options: dict[str, Any] = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "noplaylist": True,
            "socket_timeout": settings.LINK_PREVIEW_YTDLP_SOCKET_TIMEOUT,
        }

        try:
            with yt_dlp.YoutubeDL(cast(Any, options)) as downloader:
                info = downloader.extract_info(url, download=False)
        except DownloadError as exc:
            raise HTTPException(
                status_code=502,
                detail="No se pudo extraer metadata del enlace con yt-dlp.",
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail="Error inesperado al extraer metadata del enlace.",
            ) from exc

        if not isinstance(info, dict):
            return {}

        preview = {
            "title": self._normalize_text(info.get("title"), MAX_TITLE_LENGTH),
            "description": self._normalize_text(
                info.get("description"),
                MAX_DESCRIPTION_LENGTH,
            ),
            "image": self._extract_thumbnail(info, base_url=url),
            "site_name": self._normalize_text(
                self._first_non_empty(
                    info.get("channel"),
                    info.get("uploader"),
                    info.get("extractor_key"),
                ),
                MAX_SITE_NAME_LENGTH,
            ),
            "final_url": self._normalize_optional_url(
                self._first_non_empty(
                    info.get("webpage_url"),
                    info.get("original_url"),
                    info.get("url"),
                ),
                base_url=url,
            ),
        }
        return preview

    def _fetch_html(self, url: str) -> tuple[str, bytes, Optional[str], str]:
        timeout = httpx.Timeout(
            connect=settings.LINK_PREVIEW_CONNECT_TIMEOUT,
            read=settings.LINK_PREVIEW_READ_TIMEOUT,
            write=settings.LINK_PREVIEW_READ_TIMEOUT,
            pool=settings.LINK_PREVIEW_CONNECT_TIMEOUT,
        )
        headers = {
            "User-Agent": settings.LINK_PREVIEW_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        }

        try:
            with httpx.Client(
                timeout=timeout,
                follow_redirects=True,
                max_redirects=settings.LINK_PREVIEW_MAX_REDIRECTS,
                headers=headers,
            ) as client:
                with client.stream("GET", url) as response:
                    response.raise_for_status()
                    final_url = str(response.url)
                    content_type = response.headers.get("content-type", "")
                    encoding = response.encoding

                    chunks: list[bytes] = []
                    total_size = 0
                    for chunk in response.iter_bytes():
                        if not chunk:
                            continue
                        total_size += len(chunk)
                        if total_size > settings.LINK_PREVIEW_MAX_HTML_BYTES:
                            raise HTTPException(
                                status_code=502,
                                detail="El contenido del enlace supera el limite permitido.",
                            )
                        chunks.append(chunk)

                    content = b"".join(chunks)
                    if not content:
                        raise HTTPException(
                            status_code=502,
                            detail="La URL no devolvio contenido para preview.",
                        )

                    return final_url, content, encoding, content_type
        except HTTPException:
            raise
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=504,
                detail="Timeout al obtener la URL para preview.",
            ) from exc
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"El enlace devolvio estado HTTP {exc.response.status_code}.",
            ) from exc
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail="No se pudo obtener el enlace para generar preview.",
            ) from exc

    def _run_extruct(self, *, html: str, base_url: str) -> dict[str, Any]:
        try:
            return extruct.extract(
                html,
                base_url=base_url,
                syntaxes=["opengraph", "json-ld", "microdata", "rdfa"],
                errors="ignore",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail="No se pudo parsear metadata del enlace.",
            ) from exc

    def _extract_og_metadata(
        self,
        opengraph_items: list[dict[str, Any]],
        *,
        base_url: str,
    ) -> dict[str, Optional[str]]:
        properties: dict[str, str] = {}

        for item in opengraph_items:
            if not isinstance(item, dict):
                continue
            raw_properties = item.get("properties", [])
            if not isinstance(raw_properties, list):
                continue

            for entry in raw_properties:
                key: Optional[str] = None
                value: Any = None

                if isinstance(entry, (list, tuple)) and len(entry) == 2:
                    key = str(entry[0]).strip().lower()
                    value = entry[1]
                elif isinstance(entry, dict):
                    raw_key = entry.get("property") or entry.get("name")
                    key = str(raw_key).strip().lower() if raw_key else None
                    value = entry.get("content")

                if not key:
                    continue
                if key in properties:
                    continue

                text_value = self._normalize_text(value, MAX_DESCRIPTION_LENGTH)
                if text_value:
                    properties[key] = text_value

        image_candidate = self._first_non_empty(
            properties.get("og:image:secure_url"),
            properties.get("og:image:url"),
            properties.get("og:image"),
        )

        return {
            "title": self._normalize_text(properties.get("og:title"), MAX_TITLE_LENGTH),
            "description": self._normalize_text(
                properties.get("og:description"),
                MAX_DESCRIPTION_LENGTH,
            ),
            "image": self._normalize_optional_url(image_candidate, base_url=base_url),
            "site_name": self._normalize_text(
                properties.get("og:site_name"),
                MAX_SITE_NAME_LENGTH,
            ),
            "final_url": self._normalize_optional_url(
                properties.get("og:url"),
                base_url=base_url,
            ),
        }

    def _extract_structured_metadata(
        self,
        items: list[Any],
        *,
        base_url: str,
    ) -> dict[str, Optional[str]]:
        title = self._find_first_value_by_keys(items, {"headline", "name", "title"})
        description = self._find_first_value_by_keys(items, {"description"})
        image = self._find_first_value_by_keys(
            items,
            {"image", "thumbnail", "thumbnailurl", "logo"},
        )
        site_name = self._find_first_value_by_keys(
            items,
            {
                "publisher",
                "provider",
                "author",
                "creator",
                "sourceorganization",
                "ispartof",
            },
        )

        return {
            "title": self._normalize_text(title, MAX_TITLE_LENGTH),
            "description": self._normalize_text(description, MAX_DESCRIPTION_LENGTH),
            "image": self._normalize_optional_url(image, base_url=base_url),
            "site_name": self._normalize_text(site_name, MAX_SITE_NAME_LENGTH),
        }

    def _extract_rdfa_metadata(
        self,
        items: list[Any],
        *,
        base_url: str,
    ) -> dict[str, Optional[str]]:
        title = self._find_first_value_by_key_suffix(items, ("#title", "/title"))
        description = self._find_first_value_by_key_suffix(
            items, ("#description", "/description")
        )
        image = self._find_first_value_by_key_suffix(
            items,
            ("#image", "/image", "#thumbnail", "/thumbnail"),
        )
        site_name = self._find_first_value_by_key_suffix(
            items, ("#site_name", "/site_name")
        )

        return {
            "title": self._normalize_text(title, MAX_TITLE_LENGTH),
            "description": self._normalize_text(description, MAX_DESCRIPTION_LENGTH),
            "image": self._normalize_optional_url(image, base_url=base_url),
            "site_name": self._normalize_text(site_name, MAX_SITE_NAME_LENGTH),
        }

    def _extract_html_fallback(
        self, *, html: str, base_url: str
    ) -> dict[str, Optional[str]]:
        try:
            tree = lxml_html.fromstring(html)
        except (ParserError, ValueError):
            return {}

        title_values = tree.xpath("//title/text()")
        meta_description = tree.xpath(
            "//meta[translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='description']/@content"
        )
        meta_image = tree.xpath(
            "//meta[translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='image']/@content"
        )

        return {
            "title": self._normalize_text(
                self._first_non_empty(*title_values), MAX_TITLE_LENGTH
            ),
            "description": self._normalize_text(
                self._first_non_empty(*meta_description),
                MAX_DESCRIPTION_LENGTH,
            ),
            "image": self._normalize_optional_url(
                self._first_non_empty(*meta_image),
                base_url=base_url,
            ),
        }

    def _extract_thumbnail(
        self, info: Mapping[str, Any], *, base_url: str
    ) -> Optional[str]:
        thumbnail = self._normalize_optional_url(
            info.get("thumbnail"), base_url=base_url
        )
        if thumbnail:
            return thumbnail

        thumbnails = info.get("thumbnails")
        if not isinstance(thumbnails, list):
            return None

        for candidate in reversed(thumbnails):
            if not isinstance(candidate, dict):
                continue
            normalized = self._normalize_optional_url(
                candidate.get("url"), base_url=base_url
            )
            if normalized:
                return normalized
        return None

    def _merge_preview_data(
        self,
        *,
        normalized_url: str,
        final_url: str,
        extruct_preview: dict[str, Optional[str]],
        ytdlp_preview: dict[str, Optional[str]],
    ) -> dict[str, Any]:
        merged_final_url = self._first_non_empty(
            ytdlp_preview.get("final_url"),
            final_url,
        )

        has_extruct_data = any(
            extruct_preview.get(field)
            for field in ("title", "description", "image", "site_name")
        )
        has_ytdlp_data = any(
            ytdlp_preview.get(field)
            for field in ("title", "description", "image", "site_name")
        )

        source = "extruct"
        if has_extruct_data and has_ytdlp_data:
            source = "mixed"
        elif has_ytdlp_data:
            source = "yt_dlp"

        return {
            "url": normalized_url,
            "final_url": merged_final_url,
            "title": self._first_non_empty(
                extruct_preview.get("title"),
                ytdlp_preview.get("title"),
            ),
            "description": self._first_non_empty(
                extruct_preview.get("description"),
                ytdlp_preview.get("description"),
            ),
            "image": self._first_non_empty(
                extruct_preview.get("image"),
                ytdlp_preview.get("image"),
            ),
            "site_name": self._first_non_empty(
                extruct_preview.get("site_name"),
                ytdlp_preview.get("site_name"),
            ),
            "source": source,
            "fetched_at": datetime.now(timezone.utc),
        }

    def _build_response_payload(
        self,
        *,
        item_id: int,
        payload: dict[str, Any],
        cache_hit: bool,
    ) -> LinkPreviewResponse:
        return LinkPreviewResponse(
            item_id=item_id,
            url=payload["url"],
            final_url=payload["final_url"],
            title=payload.get("title"),
            description=payload.get("description"),
            image=payload.get("image"),
            site_name=payload.get("site_name"),
            source=payload.get("source", "extruct"),
            cache_hit=cache_hit,
            fetched_at=payload.get("fetched_at", datetime.now(timezone.utc)),
        )

    def _has_preview_data(self, payload: dict[str, Any]) -> bool:
        return any(
            payload.get(field)
            for field in ("title", "description", "image", "site_name")
        )

    def _should_try_ytdlp(
        self,
        *,
        normalized_url: str,
        extruct_preview: dict[str, Optional[str]],
    ) -> bool:
        if not settings.LINK_PREVIEW_YTDLP_ENABLED:
            return False
        if not self._is_ytdlp_domain_allowed(normalized_url):
            return False
        return not all(
            extruct_preview.get(field) for field in ("title", "description", "image")
        )

    def _is_ytdlp_domain_allowed(self, url: str) -> bool:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower().strip()
        if not hostname:
            return False

        allowed_domains = settings.LINK_PREVIEW_YTDLP_ALLOWED_DOMAIN_SET
        if not allowed_domains:
            return False

        for domain in allowed_domains:
            if hostname == domain or hostname.endswith(f".{domain}"):
                return True
        return False

    def _normalize_input_url(self, raw_url: str) -> str:
        if raw_url is None:
            raise HTTPException(status_code=422, detail="El item link no tiene URL.")

        candidate = raw_url.strip()
        if not candidate:
            raise HTTPException(status_code=422, detail="El item link no tiene URL.")
        if len(candidate) > 2_048:
            raise HTTPException(
                status_code=422,
                detail="La URL del item excede la longitud maxima permitida.",
            )

        parsed = urlparse(candidate)
        if not parsed.scheme:
            candidate = f"https://{candidate}"
            parsed = urlparse(candidate)

        try:
            _ = parsed.port
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail="La URL del item tiene un puerto invalido.",
            ) from exc

        if parsed.username or parsed.password:
            raise HTTPException(
                status_code=422,
                detail="La URL del item no puede incluir credenciales.",
            )

        if parsed.scheme.lower() not in ALLOWED_SCHEMES:
            raise HTTPException(
                status_code=422,
                detail="Solo se permiten URLs con esquema http o https.",
            )

        if not parsed.netloc:
            raise HTTPException(
                status_code=422, detail="La URL no contiene un host valido."
            )

        normalized_url = urlunparse(parsed._replace(fragment=""))
        self._ensure_public_host(normalized_url, status_code=422)
        return normalized_url

    def _normalize_optional_url(self, value: Any, *, base_url: str) -> Optional[str]:
        text_value = self._coerce_text(value)
        if not text_value:
            return None

        candidate = urljoin(base_url, text_value)
        parsed = urlparse(candidate)

        if parsed.scheme.lower() not in ALLOWED_SCHEMES:
            return None
        if not parsed.netloc:
            return None

        normalized = urlunparse(parsed._replace(fragment=""))
        try:
            self._ensure_public_host(normalized, status_code=422)
        except HTTPException:
            return None
        return normalized

    def _ensure_public_host(self, url: str, *, status_code: int) -> None:
        parsed = urlparse(url)
        host = parsed.hostname
        if not host:
            raise HTTPException(
                status_code=status_code, detail="La URL no contiene un host valido."
            )

        normalized_host = host.strip().lower().rstrip(".")
        if normalized_host in {"localhost", "localhost.localdomain"}:
            raise HTTPException(
                status_code=status_code,
                detail="No se permiten hosts locales en previews.",
            )

        try:
            ip = ipaddress.ip_address(normalized_host)
            if self._is_private_or_special_ip(ip):
                raise HTTPException(
                    status_code=status_code,
                    detail="La URL apunta a una direccion no publica.",
                )
            return
        except ValueError:
            pass

        try:
            addr_info = socket.getaddrinfo(normalized_host, None)
        except socket.gaierror:
            return

        for entry in addr_info:
            resolved_ip = entry[4][0]
            try:
                ip = ipaddress.ip_address(resolved_ip)
            except ValueError:
                continue
            if self._is_private_or_special_ip(ip):
                raise HTTPException(
                    status_code=status_code,
                    detail="La URL resuelve a una direccion no publica.",
                )

    @staticmethod
    def _is_private_or_special_ip(
        ip: ipaddress.IPv4Address | ipaddress.IPv6Address,
    ) -> bool:
        return any(
            (
                ip.is_private,
                ip.is_loopback,
                ip.is_link_local,
                ip.is_multicast,
                ip.is_reserved,
                ip.is_unspecified,
            )
        )

    def _decode_html(self, content: bytes, encoding: Optional[str]) -> str:
        preferred_encoding = encoding or "utf-8"
        try:
            return content.decode(preferred_encoding, errors="replace")
        except LookupError:
            return content.decode("utf-8", errors="replace")

    @staticmethod
    def _is_html_content_type(content_type: str) -> bool:
        if not content_type:
            return True
        lowered = content_type.lower()
        return "text/html" in lowered or "application/xhtml+xml" in lowered

    @staticmethod
    def _normalize_text(value: Any, max_length: int) -> Optional[str]:
        text = LinkPreviewService._coerce_text(value)
        if not text:
            return None
        compact = " ".join(text.split())
        if not compact:
            return None
        return compact[:max_length]

    @staticmethod
    def _coerce_text(value: Any) -> Optional[str]:
        if value is None:
            return None

        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None

        if isinstance(value, (int, float)):
            return str(value)

        if isinstance(value, list):
            for item in value:
                text = LinkPreviewService._coerce_text(item)
                if text:
                    return text
            return None

        if isinstance(value, dict):
            preferred_keys = (
                "name",
                "headline",
                "title",
                "description",
                "url",
                "@id",
                "@value",
                "value",
                "content",
                "text",
            )
            for key in preferred_keys:
                if key in value:
                    text = LinkPreviewService._coerce_text(value.get(key))
                    if text:
                        return text

            for nested_value in value.values():
                text = LinkPreviewService._coerce_text(nested_value)
                if text:
                    return text
            return None

        return None

    @staticmethod
    def _walk_nodes(items: Iterable[Any]) -> Iterable[Any]:
        queue = deque(items)
        while queue:
            current = queue.popleft()
            yield current
            if isinstance(current, dict):
                queue.extend(current.values())
            elif isinstance(current, list):
                queue.extend(current)

    def _find_first_value_by_keys(
        self, items: Iterable[Any], keys: set[str]
    ) -> Optional[str]:
        normalized_keys = {key.lower() for key in keys}
        for node in self._walk_nodes(items):
            if not isinstance(node, dict):
                continue
            for key, value in node.items():
                if not isinstance(key, str):
                    continue
                if key.lower() not in normalized_keys:
                    continue
                text = self._coerce_text(value)
                if text:
                    return text
        return None

    def _find_first_value_by_key_suffix(
        self,
        items: Iterable[Any],
        suffixes: tuple[str, ...],
    ) -> Optional[str]:
        lowered_suffixes = tuple(suffix.lower() for suffix in suffixes)
        for node in self._walk_nodes(items):
            if not isinstance(node, dict):
                continue
            for key, value in node.items():
                if not isinstance(key, str):
                    continue
                lower_key = key.lower()
                if not any(lower_key.endswith(suffix) for suffix in lowered_suffixes):
                    continue
                text = self._coerce_text(value)
                if text:
                    return text
        return None

    @staticmethod
    def _first_non_empty(*values: Any) -> Optional[str]:
        for value in values:
            text = LinkPreviewService._coerce_text(value)
            if text:
                return text
        return None

    def _get_cached_payload(self, normalized_url: str) -> Optional[dict[str, Any]]:
        cache_key = normalized_url.lower()
        now = monotonic()

        with self._cache_lock:
            entry = self._cache.get(cache_key)
            if entry is None:
                return None

            if entry.expires_at <= now:
                self._cache.pop(cache_key, None)
                return None

            return dict(entry.payload)

    def _set_cached_payload(self, normalized_url: str, payload: dict[str, Any]) -> None:
        ttl = max(1, settings.LINK_PREVIEW_CACHE_TTL_SECONDS)
        cache_key = normalized_url.lower()
        entry = _CacheEntry(payload=dict(payload), expires_at=monotonic() + ttl)

        with self._cache_lock:
            self._cache[cache_key] = entry


link_preview_service = LinkPreviewService()
