# GitHub Pages 发布方案与执行记录

日期：2026-10-29。用户已明确授权开通 Pages 并适配项目子目录，无需重复确认。

目标：发布 https://moneyystollings-prog.github.io/tibi--lianzi/ ，首页、每日页、归档、图片、模块脚本和下载文本均能从项目子目录访问；保持设备本地保存。

当前 GitHub 登录具备 repo 权限，没有 workflow 权限。采用 GitHub 官方支持的 gh-pages 分支根目录发布，不新增访问权限；该分支仅含构建成品和 .nojekyll。主分支保存源代码，原 EdgeOne 构建默认仍使用根路径。

- [ ] 增加可配置 BASE_PATH，统一重写模板的本地 href、src 和 srcset；canonical、分享图和 sitemap 使用相同前缀。
- [ ] 增加子目录回归检查；分别验证根路径构建和 /tibi--lianzi 构建，运行现有测试与资源检查。
- [ ] 检查变更，提交源代码；将经过验证的成品发布至 gh-pages，配置 Pages 从分支发布。
- [ ] 等待平台部署成功，实测公开页面、图片、脚本、填词保存和刷新恢复，交付直达链接。

后续每日更新仍先核验和提交内容，再构建并更新 gh-pages。不会把原始素材、用户手记、凭据或研究资料提交到发布分支。
