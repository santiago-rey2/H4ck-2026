from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Sequence
from urllib.parse import parse_qs, urlparse

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import create_db_and_tables, engine
from app.model.category import Category
from app.model.enums import ItemFormat
from app.model.items import Item, ItemCreate
from app.service.item_service import item_service

BASE_CATEGORIES = [
    "trabajo",
    "personal",
    "urgente",
    "idea",
    "estudio",
    "finanzas",
    "salud",
    "hogar",
    "proyecto",
    "tecnologia",
    "agenda",
    "recordatorio",
]

LONG_NOTE_TOPICS = [
    "mejora de rendimiento del dashboard",
    "plan de entregables semanales",
    "resumen de reunion con cliente",
    "lista de seguimiento de incidencias",
    "ideas para automatizar tareas repetitivas",
]

LINK_SEED_DESCRIPTION = "Referencia externa para pruebas de formato link."

SEED_LINK_URLS_BY_DOMAIN = {
    "developer.mozilla.org": [
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
    ],
    "react.dev": [
        "https://react.dev/learn",
        "https://react.dev/reference/react/useMemo",
    ],
    "tailwindcss.com": [
        "https://tailwindcss.com/docs/installation",
        "https://tailwindcss.com/docs/responsive-design",
    ],
    "fastapi.tiangolo.com": [
        "https://fastapi.tiangolo.com/",
        "https://fastapi.tiangolo.com/tutorial/",
    ],
    "sqlmodel.tiangolo.com": [
        "https://sqlmodel.tiangolo.com/",
        "https://sqlmodel.tiangolo.com/tutorial/fastapi/",
    ],
}

SEED_LINK_DOMAINS = tuple(SEED_LINK_URLS_BY_DOMAIN.keys())
LEGACY_LINK_PATH_PREFIX = "/resource/"


@dataclass(frozen=True)
class ShowcaseLinkCase:
    slug: str
    kind: str
    url: str
    category_names: tuple[str, ...]


SHOWCASE_LINK_CASES: tuple[ShowcaseLinkCase, ...] = (
    ShowcaseLinkCase(
        slug="react-docs",
        kind="web",
        url="https://react.dev/learn",
        category_names=("tecnologia", "estudio"),
    ),
    ShowcaseLinkCase(
        slug="youtube-video",
        kind="video",
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        category_names=("tecnologia", "idea"),
    ),
    ShowcaseLinkCase(
        slug="google-maps",
        kind="location",
        url="https://maps.google.com/?q=43.3623,-8.4115",
        category_names=("agenda", "personal"),
    ),
    ShowcaseLinkCase(
        slug="youtube-shorts",
        kind="reel",
        url="https://www.youtube.com/shorts/aqz-KE-bpKQ",
        category_names=("tecnologia", "personal"),
    ),
    ShowcaseLinkCase(
        slug="x-social",
        kind="social",
        url="https://x.com/openai",
        category_names=("trabajo", "tecnologia"),
    ),
)


@dataclass
class SeedSummary:
    initial_active_items: int
    final_active_items: int
    created_items: int
    created_categories: int
    repaired_links: int
    showcase_created: int
    showcase_updated: int


def get_active_items_count(db: Session) -> int:
    count_value = db.exec(
        select(func.count(Item.id)).where(Item.active == True),
    ).one()
    return int(count_value or 0)


def ensure_categories(db: Session) -> tuple[list[Category], int]:
    existing_categories = list(
        db.exec(select(Category).where(Category.active == True)).all(),
    )
    categories_by_name = {
        category.name.strip().lower(): category for category in existing_categories
    }

    created_count = 0
    for category_name in BASE_CATEGORIES:
        normalized_name = category_name.lower()
        if normalized_name in categories_by_name:
            continue

        category = Category(
            name=category_name,
            description=f"Categoria seed: {category_name}",
        )
        db.add(category)
        created_count += 1

    if created_count > 0:
        db.commit()

    all_categories = list(
        db.exec(select(Category).where(Category.active == True)).all()
    )
    return all_categories, created_count


def build_showcase_marker(showcase_case: ShowcaseLinkCase) -> str:
    return f"[seed:card:{showcase_case.kind}:{showcase_case.slug}]"


def build_showcase_description(showcase_case: ShowcaseLinkCase) -> str:
    return f"{LINK_SEED_DESCRIPTION} {build_showcase_marker(showcase_case)}"


def get_showcase_category_ids(
    showcase_case: ShowcaseLinkCase,
    categories_by_name: dict[str, Category],
) -> list[int]:
    category_ids: list[int] = []

    for category_name in showcase_case.category_names:
        category = categories_by_name.get(category_name.lower())
        if category is None or category.id is None or not category.active:
            continue
        category_ids.append(category.id)

    return list(dict.fromkeys(category_ids))


def ensure_showcase_link_items(
    db: Session,
    *,
    categories_by_name: dict[str, Category],
) -> tuple[int, int]:
    link_items = list(
        db.exec(
            select(Item)
            .where(Item.active == True, Item.format == "LINK")
            .options(selectinload(Item.categories))
        ).all()
    )

    items_by_marker: dict[str, Item] = {}
    items_by_url: dict[str, Item] = {}

    for item in link_items:
        item_url = (item.name or "").strip()
        if item_url and item_url not in items_by_url:
            items_by_url[item_url] = item

        description_text = (item.description or "").strip()
        if not description_text:
            continue

        for showcase_case in SHOWCASE_LINK_CASES:
            marker = build_showcase_marker(showcase_case)
            if marker in description_text and marker not in items_by_marker:
                items_by_marker[marker] = item

    categories_by_id = {
        category.id: category
        for category in categories_by_name.values()
        if category.id is not None and category.active
    }

    created_count = 0
    updated_count = 0

    for showcase_case in SHOWCASE_LINK_CASES:
        marker = build_showcase_marker(showcase_case)
        expected_description = build_showcase_description(showcase_case)
        expected_category_ids = get_showcase_category_ids(
            showcase_case,
            categories_by_name,
        )
        expected_category_id_set = set(expected_category_ids)

        target_item = items_by_marker.get(marker)
        if target_item is None:
            target_item = items_by_url.get(showcase_case.url)

        if target_item is None:
            payload = ItemCreate(
                name=showcase_case.url,
                description=expected_description,
                category_ids=expected_category_ids,
            )
            created_item = item_service.create_with_categories(db, obj_in=payload)
            created_count += 1
            items_by_marker[marker] = created_item
            items_by_url[showcase_case.url] = created_item
            continue

        current_category_id_set = {
            category.id
            for category in target_item.categories
            if category.id is not None and category.active
        }

        should_update = False

        if target_item.name != showcase_case.url:
            target_item.name = showcase_case.url
            should_update = True

        if target_item.description != expected_description:
            target_item.description = expected_description
            should_update = True

        if target_item.format != ItemFormat.LINK:
            target_item.format = ItemFormat.LINK
            should_update = True

        if current_category_id_set != expected_category_id_set:
            target_item.categories = [
                categories_by_id[category_id]
                for category_id in expected_category_ids
                if category_id in categories_by_id
            ]
            should_update = True

        if should_update:
            db.add(target_item)
            updated_count += 1

        items_by_marker[marker] = target_item
        items_by_url[showcase_case.url] = target_item

    if updated_count > 0:
        db.commit()

    return created_count, updated_count


def select_seed_link_url(seed_index: int, domain_hint: str | None = None) -> str:
    selected_domain = (
        domain_hint
        if domain_hint in SEED_LINK_URLS_BY_DOMAIN
        else SEED_LINK_DOMAINS[seed_index % len(SEED_LINK_DOMAINS)]
    )

    candidates = SEED_LINK_URLS_BY_DOMAIN[selected_domain]
    return candidates[seed_index % len(candidates)]


def is_legacy_seed_link(item: Item) -> bool:
    if not item.active:
        return False

    if (item.format or "").strip().upper() != "LINK":
        return False

    if (item.description or "").strip() != LINK_SEED_DESCRIPTION:
        return False

    raw_url = (item.name or "").strip()
    if not raw_url:
        return False

    try:
        parsed = urlparse(raw_url)
    except ValueError:
        return False

    host = (parsed.hostname or "").lower().strip()
    if host not in SEED_LINK_URLS_BY_DOMAIN:
        return False

    source_values = [
        value.lower().strip()
        for value in parse_qs(parsed.query).get("source", [])
        if isinstance(value, str)
    ]
    has_seed_source = "seed" in source_values
    has_legacy_path = parsed.path.startswith(LEGACY_LINK_PATH_PREFIX)

    return has_seed_source or has_legacy_path


def repair_legacy_seed_links(db: Session) -> int:
    link_items = list(
        db.exec(
            select(Item).where(
                Item.active == True,
                Item.format == "LINK",
                Item.description == LINK_SEED_DESCRIPTION,
            )
        ).all()
    )

    repaired_count = 0
    for fallback_index, item in enumerate(link_items, start=1):
        if not is_legacy_seed_link(item):
            continue

        parsed = urlparse((item.name or "").strip())
        host = (parsed.hostname or "").lower().strip()
        stable_index = item.id if item.id is not None else fallback_index
        replacement_url = select_seed_link_url(stable_index, domain_hint=host)

        if item.name == replacement_url:
            continue

        item.name = replacement_url
        db.add(item)
        repaired_count += 1

    if repaired_count > 0:
        db.commit()

    return repaired_count


def build_seed_name(seed_index: int, rng: random.Random) -> tuple[str, str | None]:
    variant = seed_index % 3

    if variant == 0:
        suffix = rng.randint(1000, 9999)
        return (
            f"SecureKey_{seed_index:04d}_{suffix}!",
            "Credencial generada automaticamente para dataset de prueba.",
        )

    if variant == 1:
        topic = LONG_NOTE_TOPICS[seed_index % len(LONG_NOTE_TOPICS)]
        return (
            (
                f"Nota seed #{seed_index}: Esta entrada sintetiza un bloque largo sobre {topic}. "
                "Incluye pasos sugeridos, dependencias, riesgos y proxima iteracion recomendada. "
                "Se usa para validar visualizacion de contenido extenso en el frontend tipo masonry."
            ),
            f"Detalle largo para {topic}.",
        )

    domain = SEED_LINK_DOMAINS[seed_index % len(SEED_LINK_DOMAINS)]
    return (
        select_seed_link_url(seed_index, domain_hint=domain),
        LINK_SEED_DESCRIPTION,
    )


def pick_category_ids(
    seed_index: int,
    category_ids: Sequence[int],
    rng: random.Random,
) -> list[int]:
    if not category_ids:
        return []

    max_size = min(3, len(category_ids))
    sample_size = 1 + (seed_index % max_size)
    return rng.sample(list(category_ids), k=sample_size)


def seed_database(min_items: int, random_seed: int) -> SeedSummary:
    safe_target = max(100, min_items)
    rng = random.Random(random_seed)

    with Session(engine) as db:
        categories, created_categories = ensure_categories(db)
        categories_by_name = {
            category.name.strip().lower(): category
            for category in categories
            if category.name
        }
        category_ids = [
            category.id for category in categories if category.id is not None
        ]

        initial_count = get_active_items_count(db)
        showcase_created, showcase_updated = ensure_showcase_link_items(
            db,
            categories_by_name=categories_by_name,
        )
        count_after_showcase = get_active_items_count(db)
        missing_items = max(0, safe_target - count_after_showcase)

        for offset in range(missing_items):
            seed_index = count_after_showcase + offset + 1
            name, description = build_seed_name(seed_index, rng)
            payload = ItemCreate(
                name=name,
                description=description,
                category_ids=pick_category_ids(seed_index, category_ids, rng),
            )
            item_service.create_with_categories(db, obj_in=payload)

        repaired_links = repair_legacy_seed_links(db)
        final_count = get_active_items_count(db)

    return SeedSummary(
        initial_active_items=initial_count,
        final_active_items=final_count,
        created_items=max(0, final_count - initial_count),
        created_categories=created_categories,
        repaired_links=repaired_links,
        showcase_created=showcase_created,
        showcase_updated=showcase_updated,
    )


def run_seed_if_enabled() -> SeedSummary | None:
    if not settings.SEED_ENABLED:
        return None

    summary = seed_database(
        min_items=settings.SEED_MIN_ITEMS,
        random_seed=settings.SEED_RANDOM_SEED,
    )

    print(
        "[seed] completed",
        {
            "created_categories": summary.created_categories,
            "created_items": summary.created_items,
            "repaired_links": summary.repaired_links,
            "showcase_created": summary.showcase_created,
            "showcase_updated": summary.showcase_updated,
            "initial_active_items": summary.initial_active_items,
            "final_active_items": summary.final_active_items,
        },
    )
    return summary


def main() -> None:
    create_db_and_tables()
    summary = seed_database(
        min_items=settings.SEED_MIN_ITEMS,
        random_seed=settings.SEED_RANDOM_SEED,
    )
    print(
        "[seed] completed",
        {
            "created_categories": summary.created_categories,
            "created_items": summary.created_items,
            "repaired_links": summary.repaired_links,
            "showcase_created": summary.showcase_created,
            "showcase_updated": summary.showcase_updated,
            "initial_active_items": summary.initial_active_items,
            "final_active_items": summary.final_active_items,
        },
    )


if __name__ == "__main__":
    main()
