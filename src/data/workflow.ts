export type WorkflowId = 'inspiration' | 'system' | 'motion' | 'reference' | 'delivery'

export const WORKFLOWS: Array<{
    id: WorkflowId
    name: { en: string; zh: string }
    question: { en: string; zh: string }
    description: { en: string; zh: string }
    toolIds: string[]
}> = [
    {
        id: 'inspiration',
        name: { en: 'Find a direction', zh: '寻找方向' },
        question: { en: 'What should this feel like?', zh: '它应该是什么气质？' },
        description: {
            en: 'Start with a visual reference, a real identity, or a little useful strangeness.',
            zh: '从真实的视觉参考、品牌重塑案例，或一点有趣的陌生感开始。',
        },
        toolIds: ['rebrand-gallery', 'yeguozi', 'inspora', 'wenyang', 'zhongguo-colors', 'neal-fun'],
    },
    {
        id: 'system',
        name: { en: 'Build a visual language', zh: '建立视觉语言' },
        question: { en: 'What makes it belong together?', zh: '怎样让一切属于同一个系统？' },
        description: {
            en: 'Turn references into tokens, components and decisions you can actually ship.',
            zh: '把参考转化为可用于交付的设计令牌、组件和设计决策。',
        },
        toolIds: ['open-design', 'impeccable', 'taste-skill', 'designmd-sh', 'designprompts', 'kami'],
    },
    {
        id: 'motion',
        name: { en: 'Make it move', zh: '让界面动起来' },
        question: { en: 'What should this interaction feel like?', zh: '这个交互应该是什么手感？' },
        description: {
            en: 'Study a great transition, understand its timing, then implement only what serves the idea.',
            zh: '研究出色的过渡效果，理解节奏，只实现有助于表达创意的部分。',
        },
        toolIds: ['60fps', 'feralui', 'libraries-dev', 'timing', 'paper-shaders', 'awesome-ai-motion'],
    },
    {
        id: 'reference',
        name: { en: 'Study the real thing', zh: '研究真实产品' },
        question: { en: 'How do good products solve this?', zh: '好产品是怎么解决这个问题的？' },
        description: {
            en: 'Compare real screens, flows and components instead of designing from a vague memory.',
            zh: '比较真实界面、流程和组件，不再凭模糊记忆做设计。',
        },
        toolIds: [
            'component-gallery',
            'mobbin',
            'onepagelove',
            'craftwork-websites',
            'before-click' as const,
            'namethatui',
            'game-art-style',
        ],
    },
    {
        id: 'delivery',
        name: { en: 'Finish and share', zh: '完成并交付' },
        question: { en: 'How does this leave the room?', zh: '怎样把作品交给别人？' },
        description: {
            en: 'Shape the presentation, build the experience, or find the missing piece for your next launch.',
            zh: '完善演示、搭建体验，或补齐下一次发布需要的那一块。',
        },
        toolIds: ['magic-slide', 'whatships', 'kenney', 'kurtips'],
    },
]

export const WORKFLOW_BY_TOOL = new Map(WORKFLOWS.flatMap((flow) => flow.toolIds.map((id) => [id, flow.id] as const)))

export function toolWorkflowIndex(toolId: string, workflows = WORKFLOWS) {
    const index = workflows.findIndex((flow) => flow.toolIds.includes(toolId))
    return Math.max(index, 0)
}
