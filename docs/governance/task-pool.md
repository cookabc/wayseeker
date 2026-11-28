# 优化任务池

> 从熵清单拆出的可独立执行任务。状态：done（已收敛）/ todo（待做）/ blocked（待前置条件）。
> 完成任务保留作为审计线索。

| 任务 | 轮次 | 状态 | 备注 |
| --- | --- | --- | --- |
| T1 删除旧 IA `category` 族（字段+类型+4 函数+测试断言） | R1 | done | PRODUCT.md 已声明按工作流组织；对外无导出 |
| T2 删除 `getAllTags` + 标签路径测试 | R1 | done | 0 生产调用方 |
| T3 `filterTools` 收窄签名（去 activeTag）；llms.txt 文案对齐 | R1 | done | 「tag filters」是不存在的功能 |
| T4 删除 `verdictOf`/`VerdictLine` 平行 API | R1 | done | 渲染走 labelOf/habitOf |
| T5 删除 `encodeSeed` | R1 | done | 仅自测调用 |
| T6 删除 `ExplorerRoute.seed` 与 `?seed=` 读取；write 保留遗留参数清理 | R1 | done | plan 已取代 shuffle 浏览；观察面行为不变 |
| T7 删除 `WORKFLOW_BY_TOOL`、`toolWorkflowIndex` | R1 | done | 0/仅测试调用 |
| T8 删除 `WORKFLOWS[].description` 无渲染文案 | R1 | done | 编辑资产删除，progress 记录 |
| T9 删除 `DrawerFront.dim`、`ToolPreviewImage.className/iconClassName`、`NoteCardData.color` | R2 | done | 无调用方/自认未用 |
| T10 孤儿 CSS 块删除（7 组，含复核新发现的 .measure 与 .habit/.drawer.is-dim）+ `@theme` 裁剪至实际消费 + `--gy` 死写删除 | R2 | done | 词边界复核避免子串误活 |
| T11 URL 状态收口：explorer-route 接管 `?q`/`?stage`（上限=WORKFLOWS.length），Dispensary/exploration-context 接入 | R3 | todo | 消灭 `/^[0-4]$/` 魔法正则与 4 处手写舞步 |
| T12 联系邮箱单源 site.ts CONTACT_EMAIL | R4 | todo | 3 处字面量 |
| T13 prefersReducedMotion 单源 pointer-fx | R4 | todo | 5 处手写 |
| T14 对外契约形状锁：tools.json 键集合契约测试 | R5 | todo | 防 JSON 结构无意识漂移 |
| T15 防回归：CSS 选择器孤儿扫描契约（globals.css 每个类必须在 src/e2e 语料出现） | R5 | todo | 词边界匹配，防「子串误活」 |
| T16 独立复审 + 终态回填 + e2e 全量回归 | R5 | todo | 推送后以 CI 为准 |
