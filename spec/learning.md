实现课程学习模块的数据模型。

目标：
支持 Lesson 作为课程最小学习单元。

要求：

1. 检查当前课程相关模型，现已存在 LearningTask 模型
3. 增加 LessonContent 模型，用于保存生成后的学习内容。

字段：

LessonContent:
- id
- lesson_id
- blocks(JSONB)
- version
- created_at
- updated_at

其中 blocks 采用可扩展内容块结构，不限制具体类型。

示例类型：
text
image
code
video
quiz
exercise

要求：
- 使用现有 SQLAlchemy 风格
- 添加 Alembic migration
- 不实现 Agent
- 不实现接口
- 不修改前端

完成后只报告：
- 修改文件
- 数据结构
- migration 是否成功