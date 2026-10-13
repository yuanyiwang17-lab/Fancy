"""Serve the Fancy frontend and API together for a persistent web deployment."""
from pathlib import Path
import os
import re

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from app.main import app as api_app

FRONTEND = Path(os.environ.get(
    "FANCY_FRONTEND_DIST",
    str(Path(__file__).resolve().parents[2] / "frontend" / "dist"),
)).resolve()
INDEX = FRONTEND / "index.html"

app = FastAPI(title="Fancy", version="2.0.0")
PUBLIC_READ_ONLY = os.environ.get("FANCY_PUBLIC_READ_ONLY", "true").lower() not in {"false", "0"}
PUBLIC_READ_ROUTES = re.compile(
    r"/api/(?:dashboard|experts(?:/[^/]+)?|reports(?:/[^/]+(?:/trace)?)?"
    r"|evidence(?:/[^/]+)?|tasks/[^/]+/trace|subscriptions)"
)


@app.middleware("http")
async def public_access(request, call_next):
    path = request.url.path
    if PUBLIC_READ_ONLY and path.startswith("/api/"):
        if request.method not in {"GET", "HEAD"} or not PUBLIC_READ_ROUTES.fullmatch(path):
            return JSONResponse(
                {"message": "公开展示版仅支持浏览，调研和模型调用未开放。"},
                status_code=403,
            )
    return await call_next(request)


@app.get("/", include_in_schema=False)
def home():
    if not INDEX.is_file():
        raise HTTPException(503, "Build the frontend before starting the web server.")
    return FileResponse(INDEX, headers={"Cache-Control": "no-cache"})


app.include_router(api_app.router)


@app.api_route("/{path:path}", methods=["GET", "HEAD"], include_in_schema=False)
def frontend(path: str):
    if path == "api" or path.startswith("api/"):
        raise HTTPException(404, "API endpoint not found")
    target = (FRONTEND / path).resolve()
    if not target.is_relative_to(FRONTEND):
        raise HTTPException(404, "Not found")
    if target.is_file():
        return FileResponse(target)
    if Path(path).suffix:
        raise HTTPException(404, "File not found")
    return home()
