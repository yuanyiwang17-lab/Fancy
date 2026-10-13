# Fancy

Fancy AI research workspace

## 工作分工

Fancy 使用四个固定工作角色：任务规划、资料采集、分析写作、质量检查。联网资料和舆情统一由采集负责，分析与报告由分析写作负责，质量检查保留引用核验与返工流程。选择工作角色不额外调用模型。页面中的工作方法说明实际流程，角色介绍不再展示虚构履历。

## 公网模式

访客可以浏览页面、专家资料和已公开的报告。服务端默认启用 `FANCY_PUBLIC_READ_ONLY=true`，关闭新调研、模型调用、搜索、报告深化及 API 写操作。前端构建启用 `VITE_PUBLIC_READ_ONLY=true`。

此仓库不包含 API 密钥、本机报告数据库或运行日志。Render 不需要配置模型或搜索 API 密钥。

## GitHub Pages 免费部署

公开站点：[Fancy](https://yuanyiwang17-lab.github.io/Fancy/)。静态文件发布在 `gh-pages` 分支，不启动 Python 后端，也没有 API 密钥。

构建命令：`VITE_PUBLIC_READ_ONLY=true npm --prefix frontend run build -- --base=/Fancy/`。公网版使用 HashRouter，确保导航与刷新均适用于静态托管。

`main` 分支保留源代码，`gh-pages` 分支只存构建结果。已有私有报告不会自动发布。

## 可选的 Render 静态部署

在 Render 创建 Static Site 并选择本仓库。构建命令为 `npm --prefix frontend ci && VITE_PUBLIC_READ_ONLY=true npm --prefix frontend run build`，发布目录为 `frontend/dist`。`render.yaml` 也提供相应静态站点配置。

公网部署仅托管静态页面和公开专家素材，不运行后端，不连接本机 API 或报告数据库。已有私有报告没有自动发布。详细配置见 [PUBLIC_DEPLOYMENT.md](docs/PUBLIC_DEPLOYMENT.md)。

## 容器运行

```sh
docker compose up -d --build
```

网页与 API 统一监听 8080，健康检查路径为 `/health`。
