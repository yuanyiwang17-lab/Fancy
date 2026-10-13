# Fancy

Fancy AI research workspace

Fancy 的公开展示版本，基于 [kangjiayao14/VerdaAI-Investigator](https://github.com/kangjiayao14/VerdaAI-Investigator) 改编，遵循仓库中的 AGPL-3.0 许可证。

## 公网模式

访客可以浏览页面、专家资料和已公开的报告。服务端默认启用 `FANCY_PUBLIC_READ_ONLY=true`，关闭新调研、模型调用、搜索、报告深化及 API 写操作。前端构建启用 `VITE_PUBLIC_READ_ONLY=true`。

此仓库不包含 API 密钥、本机报告数据库或运行日志。Render 不需要配置模型或搜索 API 密钥。

## Render 免费部署

在 Render 创建 Static Site 并选择本仓库。构建命令为 `npm --prefix frontend ci && VITE_PUBLIC_READ_ONLY=true npm --prefix frontend run build`，发布目录为 `frontend/dist`。`render.yaml` 也提供相应静态站点配置。

公网部署仅托管静态页面和公开专家素材，不运行后端，不连接本机 API 或报告数据库。已有私有报告没有自动发布。详细配置见 [PUBLIC_DEPLOYMENT.md](docs/PUBLIC_DEPLOYMENT.md)。

## 容器运行

```sh
docker compose up -d --build
```

网页与 API 统一监听 8080，健康检查路径为 `/health`。
