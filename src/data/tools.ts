import type { IconName } from '@/lib/icon-map'

type LocaleText = { en: string; zh: string }

/** Editorial section of the home wall the tool belongs under. */
export type ToolCategory = 'design' | 'games' | 'other'

export interface Tool {
    id: string
    type: 'link'
    category: ToolCategory
    name: LocaleText
    description: LocaleText
    tags: string[]
    url: string
    icon: IconName
    color: string
    githubUrl?: string
    note?: LocaleText
    /** Pinned in the featured strip on the home wall. */
    featured?: boolean
}

const TOOLS: Tool[] = [
    {
        id: 'open-design',
        type: 'link',
        category: 'design',
        name: { en: 'Open Design', zh: 'Open Design' },
        description: {
            en: 'Open-source design studio with 31 skills and 72 design systems',
            zh: '开源设计工作室，31 个可组合技能与 72 个品牌级设计系统',
        },
        tags: ['ai', 'design'],
        url: 'https://open-design.ai/',
        icon: 'Palette',
        color: '#3e63dd',
        featured: true,
        note: {
            en: 'When an agent needs a real design system — not another “make it pretty” prompt — I start here. Replaces generic UI kits. Caveat: pick one system and stick with it.',
            zh: '当 Agent 需要真正的设计系统、而不是「做漂亮一点」的空提示时，我从这里起手。能替代通用 UI 套件。注意：先选定一套系统并坚持用完。',
        },
    },
    {
        id: 'zhongguo-colors',
        type: 'link',
        category: 'design',
        name: { en: '中国传统配色', zh: '中国传统配色' },
        description: {
            en: '742 traditional Chinese color swatches with HEX, RGB, CMYK values',
            zh: '742 张高清中国传统色卡，含色名、HEX、RGB、CMYK 与配色推荐',
        },
        tags: ['design'],
        url: 'https://colors.xiaoxiaodong.ai/',
        icon: 'Palette',
        color: '#e5484d',
        note: {
            en: 'When a Chinese-inspired palette needs real names and print values, I open this first. Replaces random hex dumps from image samplers. Caveat: cultural names matter more than “close enough” RGB.',
            zh: '做中国风配色、需要色名和印刷可用数值时，我先打开这里。能替代从图片瞎吸 hex。注意：色名与语境比「差不多的 RGB」更重要。',
        },
        githubUrl: 'https://github.com/nevertoday/zhongguo-traditional-colors',
    },
    {
        id: 'paper-shaders',
        type: 'link',
        category: 'design',
        name: { en: 'Paper Shaders', zh: 'Paper Shaders' },
        description: {
            en: 'Ultra-fast zero-dependency shaders for designs',
            zh: '超快速零依赖的设计用着色器库',
        },
        tags: ['design'],
        url: 'https://shaders.paper.design/',
        icon: 'Sparkles',
        color: '#6e56cf',
        note: {
            en: 'When a surface needs expensive-looking motion without a heavy creative stack, I drop these in. Replaces custom shader experiments I will not maintain. Caveat: still check performance on low-end phones.',
            zh: '需要精致的动态表面、又不想引入一整套复杂的创意工具时，我直接用这套。能替代自己写、后续却疏于维护的 shader 实验。注意：低端机仍要看性能。',
        },
    },
    {
        id: 'designprompts',
        type: 'link',
        category: 'design',
        name: {
            en: 'Design Prompts',
            zh: 'Design Prompts',
        },
        description: {
            en: 'AI design style explorer with 31+ rendered styles',
            zh: 'AI 驱动的设计风格探索器，31+ 种风格提示词',
        },
        tags: ['ai'],
        url: 'https://www.designprompts.dev/',
        icon: 'Wand',
        color: '#646464',
        note: {
            en: 'When I am about to write a long design prompt, I browse styles here first. Replaces guessing a visual direction in pure text. Caveat: steal the direction, rewrite the prompt in your product’s voice.',
            zh: '当要写长设计提示词时，我先来这里扫风格。能替代纯文字里瞎猜视觉方向。注意：借方向可以，提示词还是要用自己产品的语气重写。',
        },
    },
    {
        id: 'impeccable',
        type: 'link',
        category: 'design',
        name: { en: 'Impeccable', zh: 'Impeccable' },
        description: {
            en: 'AI design intelligence with 23 commands for frontend design',
            zh: 'AI 设计智能工具，23 个命令覆盖排版、色彩、动效与交互',
        },
        tags: ['ai', 'ui'],
        url: 'https://impeccable.style/',
        icon: 'Sparkles',
        color: '#3e63dd',
        featured: true,
        note: {
            en: 'When a generated page looks “off” but I can’t name why, I run these commands. Replaces vague redesign chats. Caveat: it critiques taste — you still choose the fix.',
            zh: '当生成页面「哪里不对」却说不清时，我跑这套命令。能替代含糊的「重做一版」对话。注意：它帮你挑审美问题，拍板还是你。',
        },
    },
    {
        id: 'yeguozi',
        type: 'link',
        category: 'design',
        name: { en: 'Yeguozi', zh: '野果子' },
        description: {
            en: 'Curated film stills for home color and décor inspiration',
            zh: '精选电影截图，为家居配色与装饰氛围提供灵感参考',
        },
        tags: ['design'],
        url: 'https://www.yeguozi.com/',
        icon: 'Film',
        color: '#ab6400',
        note: {
            en: 'When a moodboard needs film grain instead of stock polish, I dig here. Replaces sterile Unsplash grids for home and interior refs. Caveat: rights vary — treat as inspiration, not free commercial art.',
            zh: '情绪板需要电影感而不是图库精修时，我来这里翻。能替代干干净净却没情绪的 Unsplash 拼贴。注意：版权各异，当灵感别当免费商用素材。',
        },
    },
    {
        id: 'magic-slide',
        type: 'link',
        category: 'design',
        name: { en: 'Magic Slide', zh: 'Magic Slide' },
        description: {
            en: 'AI-powered HTML presentations with Magic Move transitions and browser editing',
            zh: 'AI 驱动的 HTML 演示工具，支持 Magic Move 过渡与浏览器编辑',
        },
        tags: ['design'],
        url: 'https://www.magicslide.show/',
        icon: 'Presentation',
        color: '#8e4ec6',
        note: {
            en: 'When a deck must live in the browser and move with Magic Move, I use this over Keynote. Replaces fighting export pipelines for agent-built slides. Caveat: design still needs hierarchy — animation will not save a bad outline.',
            zh: '演示必须在浏览器里播放、还要 Magic Move 效果时，我用它而不是 Keynote。能替代用 Agent 做幻灯片时繁琐的导出流程。注意：动效救不了烂大纲，层级还是要做。',
        },
    },
    {
        id: 'kami',
        type: 'link',
        category: 'design',
        name: { en: 'Kami', zh: 'Kami' },
        description: {
            en: 'Warm parchment design system for AI-assisted documents',
            zh: 'AI 代理的文档设计系统，温暖的羊皮纸风格排版',
        },
        tags: ['design'],
        url: 'https://kami.tw93.fun/',
        icon: 'Pencil',
        color: '#8d8d86',
        note: {
            en: 'When Markdown previews feel cold and default, I switch to this parchment system. Replaces plain GitHub-flavored dumps for reading-heavy docs. Caveat: not every stakeholder wants warm paper — ask before standardizing.',
            zh: 'Markdown 预览太冷淡、缺少变化时，我换成这套羊皮纸风格。能替代 GitHub 风纯文本长文。注意：并非所有参与者都喜欢暖色纸张风格，统一采用前先问问。',
        },
    },
    {
        id: 'taste-skill',
        type: 'link',
        category: 'design',
        name: {
            en: 'Taste Skill',
            zh: 'Taste Skill',
        },
        description: {
            en: 'Anti-slop SKILL.md files that give AI coding agents better design taste',
            zh: '为 AI 编码 Agent 提供设计审美的 SKILL.md 技能文件，告别模板感界面',
        },
        tags: ['ai'],
        url: 'https://www.tasteskill.dev/',
        icon: 'Sparkles',
        color: '#d6409f',
        featured: true,
        note: {
            en: 'When I bootstrap a coding agent for UI work, I drop these SKILL.md files in first. Replaces hoping the model “has taste.” Caveat: still needs a real reference layout.',
            zh: '当编码 Agent 准备做 UI 时，我先给它这些 SKILL.md。能替代指望模型「自己有审美」。注意：仍要配真实参考布局。',
        },
    },
    {
        id: 'designmd-sh',
        type: 'link',
        category: 'design',
        name: { en: 'designmd.sh', zh: 'designmd.sh' },
        description: {
            en: 'Public DESIGN.md registry for AI coding and design agents',
            zh: '公共 DESIGN.md 注册表，为 AI 编码与设计代理提供设计系统',
        },
        tags: ['ai'],
        url: 'https://designmd.sh/',
        icon: 'FileCode',
        color: '#12a594',
        note: {
            en: 'When I need a public registry of agent-readable design systems, I look here. Replaces hunting random GitHub gists. Caveat: verify the system matches your stack before wiring it in.',
            zh: '需要公开、Agent 可读的设计系统注册表时，我看这里。能替代满世界翻 gist。注意：接进项目前先确认和你的技术栈匹配。',
        },
    },
    {
        id: 'neal-fun',
        type: 'link',
        category: 'games',
        name: { en: 'Neal.fun', zh: 'Neal.fun' },
        description: {
            en: 'Games, visualizations, interactives and weird stuff',
            zh: '有趣的游戏、可视化、交互实验和奇怪的东西',
        },
        tags: ['games'],
        url: 'https://neal.fun/',
        icon: 'Sparkles',
        color: '#e54666',
        note: {
            en: 'When a product demo needs a spark of play, I study interactions here. Replaces generic “delight” decks with no concrete reference. Caveat: fun is not a feature checklist — steal the feeling, not the gimmick.',
            zh: '产品演示需要一点玩心时，我来这里研究交互。能替代没有具体参考的「delight」空谈。注意：好玩不是功能清单，借感觉别抄噱头。',
        },
    },
    {
        id: 'kenney',
        type: 'link',
        category: 'games',
        name: { en: 'Kenney', zh: 'Kenney' },
        description: {
            en: 'Thousands of completely free game assets including sprites, 3D models, audio and tools',
            zh: '数千个完全免费的游戏素材，涵盖精灵图、3D 模型、音效及工具',
        },
        tags: ['games'],
        url: 'https://kenney.nl/',
        icon: 'Gamepad',
        color: '#46a758',
        note: {
            en: 'When a prototype needs art and I have zero budget, I trust Kenney first. Replaces random free packs with unclear licenses. Caveat: free assets still need consistent art direction — do not mix five packs blindly.',
            zh: '原型要美术、预算为零时，我先信 Kenney。能替代授权不清的随机免费包。注意：免费素材也要统一美术方向，别五包混用。',
        },
    },
    {
        id: 'timing',
        type: 'link',
        category: 'design',
        name: { en: 'Timing', zh: 'Timing' },
        description: {
            en: 'Translate motion timing and springs across design and code platforms',
            zh: '跨平台动效 timing 转换工具，打通设计稿与代码的弹簧/贝塞尔参数',
        },
        tags: ['ui', 'motion'],
        url: 'https://timing.xiaolin.work/',
        icon: 'Zap',
        color: '#12a594',
        featured: true,
        note: {
            en: 'When Figma springs and CSS never match, I translate here once. Replaces guessing cubic-bezier values. Caveat: still verify on the target device.',
            zh: 'Figma 弹簧和 CSS 对不上时，我来这里转一次参数。能替代瞎猜 cubic-bezier。注意：还是要在真机上过一眼。',
        },
    },
    {
        id: 'craftwork-websites',
        type: 'link',
        category: 'design',
        name: { en: 'Craftwork Websites', zh: 'Craftwork Websites' },
        description: {
            en: 'Curated website design inspiration from the Curated.design community',
            zh: '来自 Curated.design 社区精选的网站设计灵感库',
        },
        tags: ['ui'],
        url: 'https://craftwork.design/inspiration/websites',
        icon: 'Globe',
        color: '#3e63dd',
        note: {
            en: 'When I need layout patterns that still feel current, I browse this curated set. Replaces endless Awwwards tabs. Caveat: inspiration is not a clone — adapt structure to your content density.',
            zh: '需要经得起时间考验的版式参考时，我看这套精选。能替代无限开 Awwwards 标签页。注意：灵感不是克隆，结构要按你的内容密度改。',
        },
    },
    {
        id: 'onepagelove',
        type: 'link',
        category: 'design',
        name: { en: 'One Page Love', zh: 'One Page Love' },
        description: {
            en: 'One-page website inspiration gallery since 2008',
            zh: '始于 2008 年的单页网站灵感画廊',
        },
        tags: ['ui'],
        url: 'https://onepagelove.com/',
        icon: 'Star',
        color: '#e54666',
        note: {
            en: 'When a story must fit one screen, I study this long-running one-pager archive. Replaces multi-page IA for simple offers. Caveat: one page still needs ruthless editing — length is not the goal.',
            zh: '故事必须装进单屏时，我研究这套长寿的单页档案。能替代为简单的产品介绍硬做多页信息架构。注意：单页更要狠删，长度不是目标。',
        },
    },
    {
        id: 'component-gallery',
        type: 'link',
        category: 'design',
        name: { en: 'Component Gallery', zh: 'Component Gallery' },
        description: {
            en: 'Up-to-date repository of UI components from real design systems',
            zh: '基于真实设计系统的最新 UI 组件参考库',
        },
        tags: ['design', 'ui'],
        url: 'https://component.gallery/',
        icon: 'LayoutGrid',
        color: '#12a594',
        featured: true,
        note: {
            en: 'When I need how real design systems name a pattern, I open this — not Dribbble. Replaces inventing component vocabulary. Caveat: it’s reference, not a kit to copy wholesale.',
            zh: '需要看真实设计系统怎么命名某个模式时，我打开这里，而不是 Dribbble。能替代自己发明组件黑话。注意：是参考，不是整库照搬。',
        },
    },
    {
        id: 'mobbin',
        type: 'link',
        category: 'design',
        name: { en: 'Mobbin', zh: 'Mobbin' },
        description: {
            en: 'Real-world app and web UI screens, flows and patterns',
            zh: '真实 App 与 Web 界面截图、流程与模式库',
        },
        tags: ['ui'],
        url: 'https://mobbin.com/discover/apps/web/popular',
        icon: 'LayoutGrid',
        color: '#0090ff',
        note: {
            en: 'When I need “how did they structure onboarding?”, I scan real app flows here. Replaces guessing funnel steps from memory. Caveat: paid tiers exist — know what you can export before planning a research session.',
            zh: '需要「别人怎么做引导」时，我扫这里的真实 App 流程。能替代凭记忆猜漏斗步骤。注意：有付费档，研究前先搞清能导出什么。',
        },
    },
    {
        id: 'rebrand-gallery',
        type: 'link',
        category: 'design',
        name: { en: 'Rebrand Gallery', zh: 'Rebrand Gallery' },
        description: {
            en: 'Curated gallery of rebrands and visual identity launches',
            zh: '品牌重塑与视觉识别发布的精选画廊',
        },
        tags: ['design'],
        url: 'https://www.rebrand.gallery/',
        icon: 'Sparkles',
        color: '#ab6400',
        note: {
            en: 'When a logo or identity needs before/after thinking, I study rebrands here. Replaces arguing from taste alone in reviews. Caveat: context is half the story — a rebrand for a bank is not a rebrand for a game.',
            zh: 'logo/识别需要前后对比思路时，我研究这里的重塑案例。能替代评审里纯靠口味吵架。注意：语境占一半，银行重塑≠游戏重塑。',
        },
    },
    {
        id: '60fps',
        type: 'link',
        category: 'design',
        name: { en: '60fps', zh: '60fps' },
        description: {
            en: 'Collection of delightful UI animation details from best-in-class apps',
            zh: '来自一流 App 的精致 UI 动效细节合集',
        },
        tags: ['ui', 'motion'],
        url: 'https://60fps.design/',
        icon: 'Zap',
        color: '#cc4e00',
        note: {
            en: 'When micro-interactions feel flat, I raise the bar with references here. Replaces “add a little bounce” without a target. Caveat: 60fps on desktop is not free on mid-range Android.',
            zh: '微交互发闷时，我用这里的参考抬标准。能替代没有目标的「加一点弹跳」。注意：桌面上跑到 60fps 的效果，移到中端安卓仍要考虑性能开销。',
        },
    },
    {
        id: 'before-click',
        type: 'link',
        category: 'design',
        name: { en: 'before.click', zh: 'before.click' },
        description: {
            en: 'Curated App Store screenshots, paywalls and onboarding flows',
            zh: '精选的 App Store 截图、付费墙与新手引导流程参考',
        },
        tags: ['ui'],
        url: 'https://before.click/',
        icon: 'Globe',
        color: '#0797b9',
        note: {
            en: 'When store screenshots or paywalls need framing, I study this gallery. Replaces inventing conversion copy in a vacuum. Caveat: patterns age — check dates and category fit.',
            zh: '商店截图或付费墙需要文案框架时，我研究这套画廊。能替代脱离参考凭空写转化文案。注意：模式会过时，看日期和品类是否适合自己的产品。',
        },
    },
    {
        id: 'feralui',
        type: 'link',
        category: 'design',
        name: { en: 'FeralUI', zh: 'FeralUI' },
        description: {
            en: 'Playful, physics-driven React elements that move like real things',
            zh: '有趣的物理驱动 React 元素，像真实物体一样运动',
        },
        tags: ['ui', 'motion'],
        url: 'https://feralui.dev/',
        icon: 'Zap',
        color: '#00a2c7',
        note: {
            en: 'When a page feels rigid and needs physics-y life, I reach for these React bits. Replaces CSS-only hover that never surprises. Caveat: motion accessibility first — honor reduced motion.',
            zh: '页面显得僵硬、需要有物理感的交互时，我用这些 React 组件。能替代缺少惊喜的纯 CSS hover。注意：无障碍优先，尊重用户减少动态效果的设置。',
        },
    },
    {
        id: 'namethatui',
        type: 'link',
        category: 'design',
        name: { en: 'NameThatUI', zh: 'NameThatUI' },
        description: {
            en: 'Visual dictionary of UI elements: learn the real name and prompt your coding agent with precision',
            zh: 'UI 元素视觉词典，学会准确名称并用精确提示词驱动编码 Agent',
        },
        tags: ['ai', 'ui'],
        url: 'https://namethatui.com/',
        icon: 'BookOpen',
        color: '#5eb1ef',
        featured: true,
        note: {
            en: 'When I’d otherwise write “that little grey control,” I look up the real name first. Replaces fuzzy agent prompts. Caveat: names vary slightly by system — still better than “thing.”',
            zh: '只想得起「那个灰色小控件」、叫不出名称时，我先查标准名字。能替代含糊的 Agent 提示。注意：各系统叫法略有差别，但总比「那个玩意儿」强。',
        },
    },
    {
        id: 'wenyang',
        type: 'link',
        category: 'design',
        name: { en: 'Wenyang', zh: '文样' },
        description: {
            en: 'A catalogue of Chinese traditional patterns, redrawn and open-sourced for modern design',
            zh: '中国传统纹样图鉴，为现代设计重新绘制并开源',
        },
        tags: ['design'],
        url: 'https://wenyang.net/',
        icon: 'Sparkles',
        color: '#e5484d',
        note: {
            en: 'When I need authentic Chinese pattern references for branding or illustration, I browse this catalogue first. Replaces generic pattern sites or digging through historical archives. Caveat: patterns are reinterpreted for modern use — verify cultural context if you are working on heritage or formal projects.',
            zh: '当品牌或插画需要真正的中国传统纹样参考时，我先翻这个图鉴。能替代通用素材站或翻故纸堆。注意：这些纹样为现代使用做过重新诠释，用于文化遗产或正式文化项目时，先核实文化语境。',
        },
    },
    {
        id: 'whatships',
        type: 'link',
        category: 'other',
        name: { en: 'What Ships', zh: 'What Ships' },
        description: {
            en: 'A curated edit of startup launch videos, demos, and product walkthroughs from X',
            zh: '来自 X 的精选创业公司发布视频、产品演示与功能介绍合集',
        },
        tags: ['design'],
        url: 'https://whatships.com/',
        icon: 'Film',
        color: '#1c2024',
        note: {
            en: 'When I need inspiration for a product launch or demo video, I browse this curated feed first. Replaces scrolling X hoping to catch a good launch post. Caveat: launch videos are ephemeral and trends move fast — use it for inspiration, not as a permanent archive.',
            zh: '当我要为产品发布或演示视频找灵感时，我先翻这个精选合集。能替代在 X 上漫无目的地找好的发布视频。注意：发布视频时效性强、潮流变得快，把它当灵感库用，不要当永久档案。',
        },
    },
    {
        id: 'inspora',
        type: 'link',
        category: 'design',
        name: { en: 'Inspora', zh: 'Inspora' },
        description: {
            en: 'A curated archive of recent visual design and creative work, updated hourly',
            zh: '按小时更新的近期视觉设计与创意作品精选档案库',
        },
        tags: ['design'],
        url: 'https://www.inspora.design/',
        icon: 'Sparkles',
        color: '#0588f0',
        note: {
            en: 'When I need to see what design work shipped this week across disciplines, I let this hourly archive run. Replaces scrolling scattered X and Dribbble tabs hoping to catch something current. Caveat: “recent” is not “best” - treat it as a pulse check, not a canon.',
            zh: '想看本周各个领域发布了什么设计作品时，我会翻这个按小时更新的档案。能替代在 X 和 Dribbble 的多个标签页里随手刷近期作品。注意：「近期」不等于「最好」，用它了解近期动向，别当作经典作品集。',
        },
    },
    {
        id: 'awesome-ai-motion',
        type: 'link',
        category: 'design',
        name: { en: 'Awesome AI Motion', zh: 'Awesome AI Motion' },
        description: {
            en: 'Curated gallery of 460+ AI motion works with public prompts and source code',
            zh: '460+ 个 AI 动效作品的精选画廊，附公开提示词与源码案例',
        },
        tags: ['ai', 'motion'],
        url: 'https://guanmo-ai.github.io/awesome-ai-motion/',
        icon: 'Film',
        color: '#ab6400',
        githubUrl: 'https://github.com/guanmo-ai/awesome-ai-motion',
        note: {
            en: 'When I want to see what AI video can actually do before briefing one, I browse this gallery by use case. Replaces scrubbing X to find that one clip someone mentioned. Caveat: prompts are snapshots of a single run - treat them as starting points, not recipes that reproduce the result.',
            zh: '想在给 AI 下视频需求前先摸清它能做到什么程度时，我按用途翻这个画廊。能替代在 X 上大海捞针找某条被提过的片子。注意：提示词是单次运行的快照，只能当起点，不能当作保证复现结果的配方。',
        },
    },
    {
        id: 'libraries-dev',
        type: 'link',
        category: 'design',
        name: { en: 'Libraries.dev', zh: 'Libraries.dev' },
        description: {
            en: 'High-crafted UI effect libraries that ship as copy-paste prompts for coding agents',
            zh: '为 AI 编码代理打造的高质量 UI 特效库，以提示词形式交付，复制即用',
        },
        tags: ['ai', 'ui', 'motion'],
        url: 'https://libraries.dev/#components',
        icon: 'Sparkles',
        color: '#6e56cf',
        note: {
            en: 'When an agent-built interface looks generic and needs one signature motion, I hand it a prompt from here. Replaces hand-rolling loading and hover effects that never feel finished. Caveat: five effects only - pick the one that matches the product’s voice, do not stack them all.',
            zh: '当 Agent 生成的界面千篇一律、缺一个标志性动效时，我从这里复制提示词给它。能替代自己手搓却永远差口气的加载和悬停效果。注意：一共只有五个特效，选最贴合产品气质的那一个，别全往页面上叠。',
        },
    },
    {
        id: 'game-art-style',
        type: 'link',
        category: 'games',
        name: { en: 'Game Art Style', zh: '游戏美术风格' },
        description: {
            en: 'Visual atlas of 37 game art styles mapped to 103 real games',
            zh: '收录 37 种游戏美术风格、103 款真实游戏的视觉图鉴',
        },
        tags: ['games', 'design'],
        url: 'https://gameartstyle.loopyhop.com/',
        icon: 'Palette',
        color: '#5f6563',
        note: {
            en: 'When I need to pin down a game’s art direction before talking to artists, I pick a reference frame from this atlas. Replaces vague mood-board searches for “what does painterly 3D actually look like”. Caveat: the style names are the curator’s own descriptive labels, not industry standards — and a visible screenshot is not a reuse license.',
            zh: '要跟美术对齐游戏风格、却说不清「厚涂 3D 到底长什么样」时，我在这里挑一张参考图当锚点。能替代在图库网站盲搜风格关键词。注意：风格名是策展人自己下的描述性标签，不是行业标准；截图能看见也不等于可复用。',
        },
    },
    {
        id: 'kurtips',
        type: 'link',
        category: 'design',
        name: { en: 'KurTips', zh: 'KurTips' },
        description: {
            en: "3D artist Kurt Wei's free Blender series — Little Fox Forest took a million beginners into 3D",
            zh: 'Kurt 韦的免费 Blender 入门课，超过百万人从这里开始 3D',
        },
        tags: ['design'],
        url: 'https://kurtwei.com/',
        icon: 'BookOpen',
        color: '#e0621f',
        note: {
            en: "When a launch needs custom 3D art that no asset pack covers, I send people to Kurt's free series — Little Fox Forest is the gentlest on-ramp to Blender. Replaces piecing together scattered YouTube tutorials. Caveat: the series teaches stylized illustration, not hard-surface or product modelling.",
            zh: '当产品发布需要定制 3D 美术、素材包又满足不了需求时，我会推荐 Kurt 的免费系列——《小狐狸森林》是最温和的 Blender 入门。能替代在视频站上东拼西凑的零散教程。注意：偏风格化插画路线，不涵盖硬表面与产品建模。',
        },
    },
]

export function getAllTags(tools: Tool[]): string[] {
    const set = new Set<string>()
    for (const tool of tools) {
        for (const tag of tool.tags) {
            set.add(tag)
        }
    }
    return Array.from(set).sort()
}

const TAG_ACRONYMS = new Set(['ai', 'ui', 'pm', 'cli', 'api', 'md'])

export function formatTag(tag: string): string {
    return tag
        .split('-')
        .map((word) => {
            if (TAG_ACRONYMS.has(word.toLowerCase())) {
                return word.toUpperCase()
            }
            return word.charAt(0).toUpperCase() + word.slice(1)
        })
        .join(' ')
}

export function getToolById(id: string): Tool | undefined {
    return TOOLS.find((tool) => tool.id === id)
}

export function getToolPath(id: string): string {
    return `/t/${id}`
}

/** 1-based position in the curated archive order; 0 when the id is unknown. */
export function getToolNumber(id: string): number {
    return TOOLS.findIndex((tool) => tool.id === id) + 1
}

export function formatToolNumber(n: number): string {
    return `№ ${String(n).padStart(3, '0')}`
}

/** Other tools sharing at least one tag, featured first, then by tag overlap. */
export function getRelatedTools(tool: Tool, limit = 3): Tool[] {
    const tags = new Set(tool.tags)
    return TOOLS.filter((candidate) => candidate.id !== tool.id)
        .map((candidate) => {
            const overlap = candidate.tags.filter((tag) => tags.has(tag)).length
            return { candidate, overlap, featured: candidate.featured ? 1 : 0 }
        })
        .filter((entry) => entry.overlap > 0)
        .sort(
            (a, b) => b.featured - a.featured || b.overlap - a.overlap || a.candidate.id.localeCompare(b.candidate.id),
        )
        .slice(0, limit)
        .map(({ candidate }) => candidate)
}

export const CATEGORY_ORDER: ToolCategory[] = ['design', 'games', 'other']

export const CATEGORY_LABELS: Record<ToolCategory, { en: string; zh: string; eyebrow: { en: string; zh: string } }> = {
    design: {
        en: 'Design',
        zh: '设计',
        eyebrow: { en: 'Visual craft', zh: '视觉工艺' },
    },
    games: {
        en: 'Games',
        zh: '游戏',
        eyebrow: { en: 'Play & systems', zh: '玩法与系统' },
    },
    other: {
        en: 'Else',
        zh: '其他',
        eyebrow: { en: 'Discovery feed', zh: '发现源' },
    },
}

export function getToolCategory(tool: Tool): ToolCategory {
    return tool.category
}

export function groupToolsByCategory(list: Tool[]): Record<ToolCategory, Tool[]> {
    const grouped: Record<ToolCategory, Tool[]> = {
        design: [],
        games: [],
        other: [],
    }
    for (const tool of list) {
        const category = getToolCategory(tool)
        grouped[category].push(tool)
    }
    return grouped
}

export default TOOLS
