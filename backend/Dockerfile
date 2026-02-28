FROM python:3.13-slim

# 1. Instalar uv (binario oficial)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiar configuración (estando dentro de /backend/)
COPY pyproject.toml uv.lock ./

# 4. Instalar dependencias
# Esto crea la carpeta /app/.venv
RUN uv sync --frozen --no-dev

# 5. Instalar dependencias del sistema (opcional)
RUN apt-get update && apt-get install -y --no-install-recommends openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 6. COPIAR TU CÓDIGO (Punto clave)
# Copiamos tu carpeta local 'app' al directorio actual del contenedor (/app)
COPY ./app ./app

# 7. Exponer puerto
EXPOSE 8000

# Comando correcto usando uv run
CMD ["uv", "run", "fastapi", "dev", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
