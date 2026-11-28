export type WorkflowId = 'inspiration' | 'system' | 'motion' | 'reference' | 'delivery'

export const WORKFLOWS: Array<{
    id: WorkflowId
    name: { en: string; zh: string }
    question: { en: string; zh: string }
    toolIds: string[]
}> = [
    {
        id: 'inspiration',
        name: { en: 'Find a direction', zh: '寻找方向' },
        question: { en: 'What should this feel like?', zh: '它应该是什么气质？' },
        toolIds: ['rebrand-gallery', 'yeguozi', 'inspora', 'wenyang', 'zhongguo-colors', 'neal-fun'],
    },
    {
        id: 'system',
        name: { en: 'Build a visual language', zh: '建立视觉语言' },
        question: { en: 'What makes it belong together?', zh: '怎样让一切属于同一个系统？' },
        toolIds: ['open-design', 'impeccable', 'taste-skill', 'designmd-sh', 'designprompts', 'kami'],
    },
    {
        id: 'motion',
        name: { en: 'Make it move', zh: '让界面动起来' },
        question: { en: 'What should this interaction feel like?', zh: '这个交互应该是什么手感？' },
        toolIds: ['60fps', 'feralui', 'libraries-dev', 'timing', 'paper-shaders', 'awesome-ai-motion'],
    },
    {
        id: 'reference',
        name: { en: 'Study the real thing', zh: '研究真实产品' },
        question: { en: 'How do good products solve this?', zh: '好产品是怎么解决这个问题的？' },
        toolIds: [
            'component-gallery',
            'mobbin',
            'onepagelove',
            'craftwork-websites',
            'before-click',
            'namethatui',
            'game-art-style',
        ],
    },
    {
        id: 'delivery',
        name: { en: 'Finish and share', zh: '完成并交付' },
        question: { en: 'How does this leave the room?', zh: '怎样把作品交给别人？' },
        toolIds: ['magic-slide', 'whatships', 'kenney', 'kurtips'],
    },
]
