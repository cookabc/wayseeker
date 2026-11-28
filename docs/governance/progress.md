# 架构降熵治理 · 进度文件（031_wayfinder / Wayseeker）

> 目标：把 Wayseeker 演进为高度规整、极易理解、极易维护、适合大量 Agent 并行开发的工程系统。
> 方法：扫描 → 熵清单 → 方案比选 → 行为基线 → 完整迁移 → 删除旧实现 → 独立复审 → 验证 → 防回归约束。
> 约束：所有重构在隔离 worktree 分支 `governance/arch-20261128` 上进行，每批有效改进独立 commit；
> 每轮收尾 `pnpm run check`（biome → tsc → build → node:test）全绿方可提交；涉及交互行为的轮次
> 追加 `pnpm test:e2e:built` 回归。禁止新增运行时依赖。

## 基线（2026-11-28，main@360f179）

- 测试：node:test 全绿（worktree 复验同绿）；e2e 18 个 spec / 86 个用例为行为基线，未触碰。
- 结构：`src/data`（tools 目录、workflow 舞台 = 内容单源）、`src/lib`（drawers/explorer-route/
  exploration-context/plan/markdown/curator-note/note-card-image/pointer-fx 等深模块，均有配套
  node:test）、`src/components`（Dispensary 主探索器 + 标签页/抽屉/复制恢复等）、`src/app`
  （路由 + markdown 内容协商 proxy）、`public/puzzles`（独立静态区，不在本轮范围）。
- 生产约束：工具目录与策展注记是唯一内容资产；`/tools.json`、`/llms.txt`、`Accept: text/markdown`
  是对外契约，输出必须字节级兼容；视觉 token 权威在 DESIGN.md，样式集中在 globals.css；
  `pnpm run check` 与 CI 完全一致（ci-gate 模式）。

## 熵清单（勘察报告 2026-11-28，随轮次滚动收敛）

- **E1 旧 IA 残留 `category` 族**：`Tool.category` + `ToolCategory` + `getToolCategory` +
  `groupToolsByCategory` + `CATEGORY_ORDER` + `CATEGORY_LABELS` 无任何 UI/路由/导出读取；
  PRODUCT.md 明言「按工作流而非分类组织」。仅数据完整性测试在读。
- **E2 `getAllTags`**：0 生产调用方（标签筛选 UI 不存在）。
- **E3 `filterTools` 的 `activeTag` 参数**：唯一调用方恒传 `'all'`；llms.txt 文案却宣称
  「with search and tag filters」——文案与实现双双指向不存在的功能。
- **E4 `verdictOf`/`VerdictLine`**：`parseVerdict` 之上的平行 API，渲染全走
  `labelOf`/`habitOf`，该导出仅被自己的测试调用。
- **E5 `encodeSeed`**：仅 round-trip 自测调用。
- **E6 `ExplorerRoute.seed` 与 `?seed=` 读写**：plan 取代旧 shuffle 浏览后无读取方；
  Dispensary 恒写 `seed: null`。shuffle.ts 头注释仍宣称「seed 可复现浏览顺序」。
- **E7 `WORKFLOW_BY_TOOL`**：0 调用方。
- **E8 `toolWorkflowIndex`**：仅测试调用。
- **E9 `WORKFLOWS[].description`**：双语文案无渲染方（cabinet 用 name+question）。
- **E10 `DrawerFront.dim` prop**：无调用方传。
- **E11 `ToolPreviewImage.className/iconClassName`**：无调用方传参，仅默认值生效。
- **E12 `NoteCardData.color`**：注释自认「kept for callers; unused」。
- **E13 孤儿 CSS 块**：`.index-label`、`.display-heading`、`.cabinet-reset`、`.rx-anchor`、
  `.insert`/`.insert-grid`/`.insert-title`/`.insert h3`/`.insert p`（`.insert-links` 在用，保留）。
- **E14 `@theme` 未用 token**：`--color-background`/`--color-muted-foreground`/`--color-primary`/
  `--color-border`/`--font-sans`/`--font-mono`/`--default-transition-duration` 无人消费
  （仅 `--color-foreground` 经 `text-foreground` 使用）。
- **E15 `pointer-fx` 写 `--gy` 无消费者**：glint 渐变只读 `--gx`。
- **E16 探索器 URL 状态知识分裂**：`?q`（cap 200 ×4）、`?stage`（Dispensary `/^[0-4]$/`
  魔法正则 vs exploration-context 用 `WORKFLOWS.length`）、URLSearchParams+replaceState+
  syncedSearch 手写舞步 ×4。explorer-route 只管 tool/plan/p/anchor，q/stage 散布在外。
- **E17 联系邮箱 3 处字面量**：markdown.ts CONTACT_EMAIL / structured-data.ts / LegalPage.tsx（href+text）。
- **E18 prefers-reduced-motion 手写 5 处**：Dispensary.reducedMotion、theme-switch
  .prefersReducedMotion、Header 内联、HabitPeek 监听、pointer-fx.enabled 内部。
- **E19 对外契约无形状锁**：tools.json 键集合无契约测试，公共 JSON 结构可无意识漂移
  （type 字段去留这类决定无防回归承载点）。

## 终态（治理收敛后回填）

## 轮次记录

| 轮 | 内容 | Commit |
| --- | --- | --- |
