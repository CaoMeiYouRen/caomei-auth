# Copilot Instructions

## 项目规划

参考 [PLAN.md](../docs/PLAN.md)

## 项目技术栈

-   **框架**: 使用 [Vue 3](https://vuejs.org/) 和 [Nuxt 3](https://nuxt.com/) 构建。
-   **语言**: 使用 [TypeScript](https://www.typescriptlang.org/) 进行类型安全的开发。
-   **包管理**: 使用 [PNPM](https://pnpm.io/) 作为包管理工具。
-   **样式**: 使用 [SCSS](https://sass-lang.com/) 进行样式开发，遵循模块化和可维护性原则。

## 开发约定

1. **代码风格**:

    - 遵循 [ESLint](https://eslint.org/) 和 [Stylelint](https://stylelint.io/) 的规则。
    - 使用 `eslint-config-cmyr` 和 `stylelint-config-cmyr` 配置。
    - 提交代码前确保通过 `lint` 检查。

2. **提交规范**:

    - 使用 [Commitizen](https://commitizen.github.io/cz-cli/) 和 `cz-conventional-changelog-cmyr` 规范化提交信息。
    - 提交信息需符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

3. **分支管理**:

    - 主分支为 `master`，用于发布稳定版本。
    - 功能开发请创建独立分支，命名格式：`feature/<功能描述>`。

4. **依赖管理**:

    - 使用 `pnpm` 管理依赖，确保锁文件一致性。
    - 安装依赖时运行 `pnpm install`，避免使用其他包管理工具。

5. **样式开发**:

    - 使用 SCSS 编写样式。
    - 样式文件存放于 `styles` 目录。
    - 使用 @mdi/font 图标库

6. **组件开发**:
    - 组件文件存放于 `components` 目录。
    - 组件需遵循 Vue 3 单文件组件规范。
    - 组件需使用 TypeScript 进行类型定义。

## 常用命令

-   **开发环境**: `pnpm dev`
-   **构建项目**: `pnpm build`
-   **生成静态站点**: `pnpm generate`
-   **运行测试**: `pnpm test`
-   **代码检查**: `pnpm lint`
-   **提交代码**: `pnpm commit`

## 目录结构

-   `components/`: Vue 组件目录。
-   `pages/`: Nuxt 页面目录。
-   `styles/`: 样式文件目录。
-   `public/`: 公共静态资源目录（如图片、字体等）。
-   `plugins/`: Nuxt 插件目录。
-   `store/`: 状态管理目录。
-   `utils/`: 工具函数目录。
-   `server`: 服务器端代码目录（如 API 路由等）。
    -   `server/api/`: API 路由目录。
    -   `server/middleware/`: 服务器中间件目录。
    -   `server/config/`: 服务器配置目录。
    -   `server/utils/`: 服务器端工具函数目录。
    -   `server/database/`: 数据库相关代码目录。
-   `middleware/`: 中间件目录。
-   `tests/`: 测试代码目录。
-   `config/`: 配置文件目录。

## 注意事项

-   确保 Node.js 版本 >= 18。
-   提交代码前运行 `pnpm lint` 和 `pnpm test`，确保代码无错误。
-   遵循模块化和组件化开发原则，提升代码可维护性。
-   文件名称优先使用小写字母和连字符（kebab-case），如 `my-component.vue`。
-   使用 TypeScript 进行类型定义，确保代码的类型安全。
-   新增任何代码前，请先检查现有代码是否有类似功能，避免重复实现。如果已有功能，请考虑复用或扩展现有代码。
-   在添加 CSS 样式时，优先使用现有的样式变量和混合宏，以保持样式的一致性和可维护性。并且，确保样式符合项目的整体设计规范。
