---
name: frontend-expert
description: 设计或实现 Vue 3、Nuxt、React 兼容组件、页面、样式、交互、表单、状态绑定与 i18n 文本时使用。用户提到 component、page、UI、frontend、form、responsive、SCSS、BEM、dark mode、accessibility、i18n、设计落地时都应触发。

metadata:
  internal: true
---

# Frontend Expert

铁律：不要在没有确认信息结构、设计约束和文本国际化策略前直接堆界面代码。

## 工作流

- [ ] Step 1: 确认界面目标 ⚠️ REQUIRED
	- [ ] 1.1 明确这是页面、组件、表单还是交互细节修复。
	- [ ] 1.2 盘点现有设计语言、组件模式和状态来源。
- [ ] Step 2: 先做结构，再做样式 ⚠️ REQUIRED
	- [ ] 2.1 先明确组件职责、props、事件和状态边界。
	- [ ] 2.2 再编排布局、层级和可访问性语义。
- [ ] Step 3: 处理实现约束
	- [ ] 3.1 文本默认走 i18n，不硬编码最终文案。
	- [ ] 3.2 样式优先使用设计 token、语义类名和可维护结构。
	- [ ] 3.3 页面级改动考虑 SEO、加载状态和空态。
- [ ] Step 4: 做视觉与交互验证
	- [ ] 4.1 检查响应式、键盘可达性、禁用态和错误态。
	- [ ] 4.2 只要有视觉改动，建议联动 ui-validator 做实机验证。

## 关注点

- 组件是否单一职责、易复用、易组合。
- 文本、图标、颜色和对比度是否适配多语言与深浅主题。
- 表单交互是否覆盖 loading、error、empty 和 success 状态。
- 样式命名是否稳定，而不是临时补丁。

## 项目特化提示

- 组件实现优先沿用 <script setup lang="ts">、Composition API 和现有 UI 组件库，而不是平行引入另一套风格。
- 样式优先保留 BEM、设计 token、全局变量和 mixin 的约束，不用 !important 做补丁。
- 页面级组件要考虑 useHead 或 definePageMeta 一类 SEO 元信息入口。
- 文本默认走 useI18n 或 $t()，不要因为赶工回退到硬编码文案。

## 反模式

- 直接在模板里堆复杂业务逻辑。
- 用硬编码文本、尺寸或颜色快速糊过去。
- 只看桌面端，不看移动端和暗色模式。
- 为了修一个样式问题加入大面积 !important。

## 交付前检查

- [ ] 结构、状态和视觉职责已经分清。
- [ ] 文本已考虑 i18n，样式已考虑 token 和可维护性。
- [ ] 关键状态与响应式场景已覆盖。
- [ ] 有视觉变更时，已计划或执行 ui-validator 验证。








