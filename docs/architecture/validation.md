# 统一校验方案分析与决策

## 1. 现状分析

目前项目中的校验逻辑主要分散在以下几个地方，且采用的技术栈较为基础：

### 1.1 当前使用的工具

-   **`validator` (npm package)**: 用于基础的字符串验证（如 `isEmail`, `isMobilePhone`, `isURL`）。
-   **自定义正则 (`utils/validate.ts`)**: 用于用户名、昵称等特定业务规则的验证。
-   **手动逻辑**: 在 Vue Composables (`useLoginFlow.ts`) 和 API Handlers (`server/api/**`) 中，通过 `if` 语句手动判断字段是否存在、是否合法。

### 1.2 存在的问题

1.  **逻辑重复**: 相同的校验规则（如“邮箱必填”、“手机号格式”）在前端表单提交、后端 API 接收处重复编写。
2.  **类型不安全**:
    -   前端：`validateEmail(email)` 返回 `boolean`，但 TypeScript 无法据此推断数据的后续类型。
    -   后端：`readBody(event)` 返回 `any` 或泛型，缺乏运行时的结构保证。开发者需要手动编写 `if (!body.userId)` 等防御性代码。
3.  **错误提示分散**: 错误文案（"请输入有效的邮箱"）硬编码在各个组件或 Composable 中，难以统一管理和国际化。
4.  **维护成本高**: 当业务规则变更（如密码强度要求变化）时，需要同时修改前端校验函数、后端接口校验逻辑以及相关的错误提示文案。

## 2. 为什么引入 Zod？

虽然 `validator` 库提供了基础的验证函数，但它只是一个**工具库**，而非**Schema 验证库**。引入 Zod 是为了解决架构层面的问题。

### 2.1 Zod vs Validator

| 特性         | Validator / Regex                             | Zod                                                    |
| :----------- | :-------------------------------------------- | :----------------------------------------------------- |
| **定位**     | 字符串验证工具函数库                          | Schema 声明与验证库                                    |
| **验证方式** | 命令式 (Imperative): `if (!isEmail(val)) ...` | 声明式 (Declarative): `z.string().email()`             |
| **类型推导** | 无，需手动定义 Interface                      | **自动推导**: `type User = z.infer<typeof UserSchema>` |
| **数据转换** | 需手动处理 (如 `Number(val)`)                 | 内置转换 (如 `z.coerce.number()`)                      |
| **组合性**   | 差，难以复用部分逻辑                          | 强，支持 `pick`, `omit`, `extend`, `merge`             |
| **错误处理** | 需手动管理错误消息                            | 内置错误收集，支持自定义错误 Map                       |

### 2.2 Zod vs 其他 Schema 库 (Yup, Joi, Class-Validator)

-   **vs Class-Validator**: Class-Validator 依赖装饰器和类，更适合 NestJS/Java 风格的 OOP 架构。Vue 3 / Nuxt 3 推荐函数式编程和 Plain Object，Zod 更契合。
-   **vs Joi**: Joi 对 TypeScript 的支持不如 Zod 原生（Zod 设计之初就是 TypeScript First）。
-   **vs Yup**: Yup 与 Zod 类似，但 Zod 的类型推导通常被认为更准确，且在现代 React/Vue 生态中（如 `shadcn/ui`, `nuxt-form`）Zod 的集成度更高。

### 2.3 核心优势

1.  **单一事实来源 (Single Source of Truth)**:
    -   在 `utils/shared/validators.ts` 定义一份 Schema。
    -   前端表单直接使用该 Schema 进行校验。
    -   后端 API 直接使用该 Schema 解析 Request Body。
    -   TypeScript 类型定义直接从 Schema 导出。
2.  **开发者体验**:
    -   IDE 智能提示。
    -   消除手动编写 `interface` 和 `validation logic` 之间的同步负担。
3.  **生态集成**:
    -   项目已安装 `@primevue/forms`，它与 Zod 有良好的集成支持。
    -   Nuxt 服务端可配合 `h3-zod` 实现极简的参数校验。

## 3. 迁移策略

为了平滑过渡，我们采取**共存与渐进式替换**的策略，不搞“一刀切”。

### 3.1 第一阶段：基础设施建设 (当前阶段)

1.  安装 `zod`。
2.  创建 `utils/shared/validators.ts`，将 `utils/validate.ts` 中的核心正则逻辑迁移为 Zod Schema（如 `emailSchema`, `phoneSchema`）。
3.  保留 `utils/validate.ts`，但在内部逐步改用 Zod 实现（可选），或者标记为 `@deprecated`。

### 3.2 第二阶段：前端表单改造

1.  在 `composables/core/use-form.ts` 中增加对 Zod Schema 的支持。
2.  在新开发的页面或重构的页面（如 `register.vue`, `login.vue`）中，优先使用 Zod Schema 进行表单校验。

### 3.3 第三阶段：后端 API 改造

1.  在 `server/utils` 中引入 `zod` 校验工具（或使用 `h3-zod`）。
2.  在修改或新增 API 时，使用 `schema.parse(body)` 替代手写的 `if` 检查。

## 4. 结论

引入 Zod 不是为了替换 `validator` 库（Zod 内部甚至可以调用 `validator` 的函数），而是为了引入**Schema 驱动开发**的模式。这将显著提升代码的可维护性、类型安全性和前后端的一致性，符合项目重构“降低耦合、提升复用”的总体目标。
