# 黑白谜题集 · B/W Puzzles

极简黑白风格数字与逻辑游戏合集，纯 HTML/CSS/JS 实现，零依赖、零广告、打开即玩。

> This is a standalone side site served under `/puzzles` (excluded from search engines via `robots.ts`). It is unrelated to the Wayseeker tool guide and keeps its own Chinese documentation; the game names below are the ones shown in the interface.

## 运行

在仓库根目录运行：

```bash
python3 -m http.server 8000 --directory public
# 访问 http://localhost:8000/puzzles/
```

## 游戏列表

| 游戏 | 页面 | 玩法 |
|---|---|---|
| **black · 黑** | `black.html` | Bart Bonte 风格复刻。50 个关卡，每关机制不同（点击 / 按住 / 涂抹 / 翻转灯 / 顺序 / 凑数 / 滑块 / 色词干扰 / 时机 / 拼字 / 记忆 / 追逐 / 灌水 / 转盘 / 计数 / 拖拽 / 配对），唯一目标是让屏幕变成纯黑。进度自动保存。 |
| **0h h1 · 哦嗨** | `0hh1.html` | Takuzu 规则：填满方阵，每行每列黑白各半、无三连同色、无重复行列。4×4 到 10×10，实时错误高亮，计时。 |
| **0h n0 · 哦诺** | `0hn0.html` | 黑点数字 = 四方向被白块挡住前可见的黑点数。推理每个格子的黑白归属。5×5 到 9×9。 |
| **黑白迭代** | `iteration.html` | 最强大脑同款。点击方块连同上下左右一起反转黑白，拼出目标图形；图案由随机操作生成，保证有解。3×3 到 5×5。 |
| **Binary** | `binary.html` | Simon Tatham's Puzzles 同款二进制矩阵（0/1 数字皮肤），规则同 Takuzu，附计时器。 |
| **Nonogram · 数织** | `nonogram.html` | 单色数织：边缘数字表示连续黑块长度。内置爱心 / 小树 / 蘑菇 / 外星人 / 小房子 / 骷髅图案 + 随机 12×12。支持拖动填充与 × 标记，完成行列自动划线。 |

## 操作

- 五种格子游戏支持完整键盘操作：Tab 进入棋盘，方向键移动，Home / End 到行首 / 行尾，Ctrl + Home / End 到棋盘首尾，空格或 Enter 操作，Tab 离开。给定格可读取，但不可修改。
- `0h h1`、`Binary`、`0h n0` 按住 Shift 反向切换；鼠标右键也可反向。每格提供坐标、格值、给定状态和规则冲突说明。
- 数织先选择「填充」或「标记」模式，支持鼠标和触屏拖填。大棋盘溢出时提供「左移 / 右移」，行提示保持可见；方向键会将当前格滚入视区。清空可重新开始同一图案。
- 操作结果与完成状态由独立状态区域反馈；计时不会持续打断读屏。
- `black` 使用 Canvas 与指针交互，拼字关支持键盘输入；五种格子游戏的键盘能力不代表全部 Canvas 关卡都支持键盘。

## 文件结构

```
index.html          菜单
style.css           共享样式
js/grid-input.js    格子游戏的键盘导航与焦点管理
black.html          + js/black.js      50 关 Canvas 引擎
0hh1.html           + js/takuzu.js     Takuzu 引擎（方块皮肤）
binary.html         + js/takuzu.js     同一引擎（0/1 数字皮肤）
0hn0.html           + js/ohn0.js
iteration.html      + js/iteration.js
nonogram.html       + js/nonogram.js
```
