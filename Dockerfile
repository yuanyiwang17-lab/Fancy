FROM node:22-bookworm-slim AS frontend
ARG VITE_PUBLIC_READ_ONLY=true
ENV VITE_PUBLIC_READ_ONLY=$VITE_PUBLIC_READ_ONLY
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    FANCY_FRONTEND_DIST=/app/frontend/dist VERDA_DB_PATH=/data/fancy.db PORT=8080 \
    FANCY_PUBLIC_READ_ONLY=true
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app/ ./backend/app/
COPY --from=frontend /build/frontend/dist/ ./frontend/dist/
RUN mkdir -p /data
WORKDIR /app/backend
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn app.web:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1"]
