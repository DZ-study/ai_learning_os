import type { LessonContent } from '@/types/lesson'

export const mockLessonMeta = {
  courseName: 'React 前端开发实战',
  chapterName: '第一章 组件基础',
  lessonTitle: '什么是 React 组件',
}

export const mockLessonContent: LessonContent = {
  id: 'content-1',
  lessonId: 'lesson-1',
  title: '什么是 React 组件',
  blocks: [
    {
      id: '1',
      type: 'text',
      title: '什么是 React 组件',
      data: {
        markdown: [
          '# 什么是 React 组件',
          '',
          '组件是 React 应用的**最小构建单元**。它把 UI 拆分成独立、可复用的片段，',
          '每个组件负责渲染页面的一部分。',
          '',
          '## 组件的特点',
          '',
          '- *可复用*：定义一次，到处使用',
          '- *可组合*：小组件拼成大组件',
          '- *独立维护*：逻辑和样式封装在内部',
          '',
          '可以把组件理解为**返回 UI 的函数**：接收 `props` 输入，返回描述界面的 JSX。',
        ].join('\n'),
      },
    },
    {
      id: '2',
      type: 'code',
      title: '第一个组件',
      data: {
        language: 'tsx',
        code: [
          'function Greeting({ name }: { name: string }) {',
          '  return <h1>你好，{name}！</h1>',
          '}',
          '',
          'export default function App() {',
          '  return <Greeting name="React 学习者" />',
          '}',
        ].join('\n'),
      },
    },
    {
      id: '3',
      type: 'text',
      title: '函数组件与 JSX',
      data: {
        markdown: [
          '## 函数组件',
          '',
          '现代 React 推荐使用**函数组件**：一个普通的 JavaScript 函数，',
          '名字以大写字母开头，返回 JSX。',
          '',
          '## JSX 规则',
          '',
          '- 只能返回**一个根元素**（或使用 Fragment）',
          '- 所有标签必须闭合',
          '- 属性使用驼峰命名，如 `className`、`onClick`',
        ].join('\n'),
      },
    },
    {
      id: '4',
      type: 'quiz',
      title: '知识检测',
      data: {
        question: '以下关于 React 组件的说法，哪一个是正确的？',
        options: [
          '组件名必须以小写字母开头',
          '组件是可以复用的、返回 JSX 的函数',
          '一个组件可以返回多个并列的根元素',
          '组件内部不能使用其他组件',
        ],
        answer: '组件是可以复用的、返回 JSX 的函数',
      },
    },
    {
      id: '5',
      type: 'exercise',
      title: '动手练习',
      data: {
        markdown:
          '编写一个 `Profile` 组件，接收 `name` 和 `role` 两个 props，渲染一张简单的名片。',
      },
    },
  ],
}
