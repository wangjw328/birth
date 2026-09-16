# GitHub 与 Cloudflare Pages 部署

这个仓库已经包含可以直接部署的静态网站，不需要安装依赖或执行构建。

## GitHub

- 默认分支：`main`
- 网站文件：`dist/`
- 第一次推送后，GitHub 仓库的分支列表中必须能看到 `main`
- Cloudflare Pages 读取的是分支，不是 Git 标签；不需要创建 `v1.0.0` 一类的标签

## Cloudflare Pages 控制台

连接 GitHub 仓库后填写：

- Production branch（生产分支）：`main`
- Framework preset（框架预设）：`None`
- Build command（构建命令）：留空
- Build output directory（构建输出目录）：`dist`
- Root directory（根目录）：留空或 `/`
- Environment variables（环境变量）：不需要

如果生产分支下拉框中没有 `main`，说明本地分支还没有推送到 GitHub，或 Cloudflare 尚未获得该仓库的访问权限。先在 GitHub 网页确认能看到 `main` 和 `dist/index.html`，然后回到 Cloudflare 重新选择仓库。

## 网站入口

- 最新生日体验：`/`（自动进入 `/birthday/`）
- 生日直接入口：`/birthday/`
- 全部主题入口：`/collection/`
- 纪念日：`/anniversary/`
- 告白：`/confession/`
- 节日：`/festivals/`
- 中秋：`/festivals/mid-autumn/`

`wrangler.toml` 也已把 Pages 输出目录声明为 `dist`，以后使用 Wrangler 部署时会沿用同一目录。
