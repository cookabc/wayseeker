[English](README.md) · **简体中文**

# Wayseeker

按工作流探索设计、开发与创意工具的双语（EN/中文）指南。Next.js 16 App Router + React 19 + Tailwind v4，收录事实与策展评论全部在 `src/data/tools.ts`，任务路径在 `src/data/workflow.ts`。

Wayseeker 是一只给创作用的百子柜：首页先列出 29 种常见的将就，每种对应一格贴了标签的抽屉，标签写明何时用、替代什么、注意什么。五列对应「寻找方向 → 建立视觉语言 → 让界面动起来 → 研究真实产品 → 完成并交付」，最后可以开一张五行的方子，复制成 Markdown 交给 Agent。

<p align="center">
  <img src="docs/images/home.png" width="880" alt="Wayseeker：将就清单与取出的抽屉标签">
</p>

站点默认英文，页头可切到中文，选择按访客持久化。文案在 `public/locales/{en,zh}/common.json`。

生产站为 [wayseeker.vercel.app](https://wayseeker.vercel.app)；canonical origin 在 `src/lib/site.ts` 中配置，部署前须与实际部署地址一致。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 开发服务器（端口 4000） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 生产服务器（`next start`，默认 3000 端口） |
| `pnpm check` | 完整门禁：biome → tsc → build → node:test，与 CI 相同 |
| `pnpm lint:fix` | biome 自动修复 |
| `pnpm typecheck` | `tsc --noEmit` |

测试用 Node 内置 runner（`node --experimental-strip-types --test`），测试文件与被测代码同目录。工作流契约测试保证每个工具恰好属于一条任务路径。

## 探索状态与浏览器回归

分享链接同时保存 `seed` 和 `tool`，打开后恢复随机路径及当前工具；未知工具 ID 会被忽略。翻到说明面时，隐藏预览退出键盘导航。搜索关闭后焦点返回入口，输入时不会误触探索快捷键。剪贴板写入失败有中文、英文提示。

首次运行 `pnpm exec playwright install chromium`，再执行 `pnpm test:e2e`。测试先构建生产站，再检查桌面和手机视口下的分享、翻面、键盘焦点与中英文详情往返；CI 独立运行该流程，失败时保存跟踪。

## 样式

全部样式在 `src/app/globals.css` 一个文件里：宣纸、墨绿漆、黄铜、印泥红四种材质的 token，以及各组件样式。视觉体系以 [DESIGN.zh-CN.md](DESIGN.zh-CN.md)（英文版 [DESIGN.md](DESIGN.md)）为准。

## 文档

[DESIGN.md](DESIGN.md) 与 [PRODUCT.md](PRODUCT.md) 各有并列存放的中文版。

| 英文 | 中文 | 内容 |
| --- | --- | --- |
| [DESIGN.md](DESIGN.md) | [DESIGN.zh-CN.md](DESIGN.zh-CN.md) | 视觉体系：配色、字型、布局、组件 |
| [PRODUCT.md](PRODUCT.md) | [PRODUCT.zh-CN.md](PRODUCT.zh-CN.md) | 用户、定位、原则、无障碍 |
| [docs/design-constraints.md](docs/design-constraints.md) | — | 仍然成立的约束：布局边界、主题、语言，以及什么算验证过 |

## 预览图管线

收录预览图存于 `public/previews/{id}.png`：

- `pnpm download-previews`：抓取各工具站点截图，完成后接续优化。
- `pnpm optimize-previews`：sharp 原地重编码（长边 1600px + palette PNG）。它会重编**所有**预览图，只想提交单张新图时先还原其余文件。

## 新增收录

1. 在 `src/data/tools.ts` 加一条记录（en/zh 描述有最小长度约束，测试强制）。
2. 在 `src/data/workflow.ts` 将它放入唯一一条任务路径。
3. 预览图放 `public/previews/{id}.png`。
4. `pnpm check` 全绿后提交。

## 环境版本

- Node：`.nvmrc` 固定 `24`，CI 使用同版本。
- 包管理器：版本由 `package.json` 的 `packageManager` 字段钉住。本机 pnpm 与钉版不一致时会自切换；断网或全隧道代理环境下自切换的签名校验可能失败——此时直接执行 `node_modules/.bin/` 下的 `biome` / `tsc` / `next`，测试改用 nvm 绝对路径的 node 跑。

## 许可

MIT，见 [LICENSE](LICENSE)。
