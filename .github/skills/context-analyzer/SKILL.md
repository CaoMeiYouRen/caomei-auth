---
name: context-analyzer
description: 分析项目上下文、Nuxt 3 结构和依赖项，用于规划和调试。
version: 1.0.0
author: GitHub Copilot
applyTo: "**/*.{ts,vue,json,md}"
---

# Context Analyzer Skill (上下文分析技能)

## 能力 (Capabilities)

-   **项目结构分析**: 理解 Nuxt 3/4 目录约定 (`server/api`, `components`, `pages`)。
-   **符号解析**: 定位组件、自动导入的可组合函数 (composables) 和 TypeORM 实体的定义 (通常在 `server/entities`)。
-   **依赖检查**: 读取 `package.json` 以验证已安装的包和版本。

## 指令 (Instructions)

1.  **读取结构**: 使用目录列表工具了解布局，忽略 `node_modules` 和 `.output`。
2.  **识别后端目录**: 将 `server/` 识别为后端逻辑，包含 API (`server/api`), 实体 (`server/entities`), 工具库 (`server/utils`) 和数据库配置 (`server/database`)。
3.  **识别前端目录**: 将 `pages`/`components`/`composables`/`layouts` 识别为前端。
4.  **追踪逻辑**: 广泛搜索符号定义，以理解数据如何在后端实体 (Entities) 和前端组件 (Components) 之间流动。
5.  **依赖项**: 在建议导入之前检查 `package.json` 以了解可用的库 (如 `dayjs`, `lodash-es`, `fs-extra`)。

## 使用示例 (Usage Example)

输入: "分析当前的用户认证流程。"
动作: 读取 `server/api/auth/*`, `lib/auth.ts`, `middleware/auth.global.ts` 和 `pages/login.vue` 来映射流程。
