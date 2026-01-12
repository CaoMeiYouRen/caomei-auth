---
name: nuxt-code-editor
description: 遵循项目标准生成和修改 Vue 3、TypeScript 和 SCSS 代码。
version: 1.0.0
author: GitHub Copilot
applyTo: "**/*.{ts,vue,scss}"
---

# Nuxt Code Editor Skill (Nuxt 代码编辑技能)

## 能力 (Capabilities)

-   **Vue 3 Composition API**: 生成 `<script setup lang="ts">` 组件。
-   **PrimeVue 4 集成**: 根据 `utils/` 或现有的 `components/` 用法正确使用 PrimeVue 4 组件。
-   **图标库**: 使用 `@mdi/font` (Material Design Icons) 作为图标库。
-   **类型安全**: 确保所有后端代码使用在 `server/entities` 或 `types/` 中定义的 TypeORM 实体和 DTO。
-   **增量编辑**: 优先修补 (patch) 而非重写整个文件，以保留上下文。

## 指令 (Instructions)

1.  **代码风格指南**: 遵守 ESLint 和 Stylelint 配置。样式使用 SCSS，并适用 BEM 命名约定。
2.  **组件标准**: 使用 `defineProps`, `defineEmits` 并配合 TypeScript 接口/类型。
3.  **后端标准**: 确保 `server/api` 处理程序使用 `defineEventHandler` 并返回标准化响应 (参考 `docs/standards/api.md`)。
4.  **国际化 (I18n)**: 遵循 `docs/standards/i18n.md` 中的规范，逐步将硬编码文本替换为翻译键。
5.  **文件**: 创建文件时，确保它们位于正确的 Nuxt 目录 (`components`, `composables`, `server/api` 等) 中。

## 使用示例 (Usage Example)

输入: "创建一个按钮组件。"
动作: 使用 PrimeVue 4 Button 生成 `components/base/AppButton.vue`，并在 TS 接口中定义 props，图标使用 `mdi-*` 类名。
