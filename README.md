# 提笔--练字

每日一页中英双语文学练字手记。包括主题插画、电影短引、诗词古文、现代文学、近期文化话题、楷书练习字、单字炼字填空和自由随笔。

## 使用

访问已部署的网站，或在本机运行：

```sh
npm --prefix site run build
npm --prefix site start
```

然后打开 http://127.0.0.1:4173 。Windows 也可双击 `启动字间.cmd`。Node.js 22 及以上即可，无须安装运行依赖。

手记仅存储在访客当前设备、当前浏览器的 IndexedDB 中，不上传到网站服务器，不跨设备同步。清除网站数据、无痕模式、浏览器存储限制都可能影响恢复，请使用“导出文字”下载备份。网站按日期和周期隔离手记，并阻止旧标签页覆盖更新后的记录。

## GitHub Pages

成品地址：https://moneyystollings-prog.github.io/tibi--lianzi/ 。Pages 从 `gh-pages` 分支根目录发布构建成品，`main` 分支保留源代码。

在 PowerShell 中构建项目子目录版本：

```powershell
$env:BASE_PATH = '/tibi--lianzi'
$env:SITE_URL = 'https://moneyystollings-prog.github.io'
npm --prefix site run build
npm --prefix site test
npm --prefix site run check
```

将检查通过的 `site/dist/` 全部内容（包括 `.nojekyll`）更新到 `gh-pages` 根目录后推送，GitHub 自动发布该分支。只推送 `main` 不会更新成品网站。`BASE_PATH` 统一处理页面导航、图片、响应式图片、脚本、阅读文本、分享信息和 sitemap；不设置时仍构建根路径版本，适用于本地预览与 EdgeOne。

GitHub Pages 与 EdgeOne 是不同站点，浏览器手记按站点隔离，不自动迁移；切换前请导出备份。构建完成后如需本地根路径预览，先清除两个环境变量并重新构建。

## EdgeOne Pages / Makers

导入本仓库，使用根目录的 `edgeone.json`：

- 项目根目录：仓库根目录
- 框架：Other / 其他
- 安装命令：`node --version`
- 构建命令：`npm --prefix site run build`
- 输出目录：`site/dist`
- Node.js：22.11.0

不需要账号数据库、API Token、服务器写入权限或后端函数。绑定正式域名后，更新 `site/site.config.json` 的 `siteUrl`，或在平台设置 `SITE_URL=https://你的域名`。构建会生成 canonical、分享信息与 sitemap。

## 每日内容

`site/content/days/` 保存每日 JSON，`site/data/cycle.json` 保存永久去重档案。新内容先设为 `draft`，核验引文、译文、来源、话题与主题去重后，运行：

```sh
node site/scripts/build.mjs --preview
npm --prefix site test
npm --prefix site run check
```

确认后改为 `completed`，运行 `node site/scripts/record.mjs 当日id` 和正式构建。修改同一天保留其 id。构建同时核验现存每日文件与永久档案，并重新生成输出目录，避免残留撤下页面。

配图使用 WebP，并提供手机尺寸。原始大图、旧本机手记、研究资料和凭据不进入公开仓库与部署目录。

## 内容和素材

电影主题封面为本站原创抽象编辑设计，非官方海报，不使用电影剧照或演员肖像；官方作品页链接随内容展示。五张文学与主题插画为 AI 生成，并按相关作品全文意境策划。短引、作者与作品名称用于作品介绍和评读，相关权利归原权利人。

结构参考 AstroPaper、Fuwari 的归档与阅读组织方式，未复制主题代码或演示素材。生图策划参考 GPT-Image2-Skill。具体来源随每日正文展示。
