# Nuxt 调试构建指南

本文档介绍如何在 Nuxt 项目中构建用于调试的版本，这种版本不混淆、不压缩，并且包含 source map，便于生产环境问题排查。

## 构建命令

### 1. 调试构建（推荐）

```bash
# SSR 调试构建
pnpm run build:debug

# 静态站点调试构建
pnpm run generate:debug
```

### 2. 临时环境变量构建

```bash
# Windows PowerShell
$env:DEBUG_BUILD="true"; pnpm run build

# Windows CMD
set DEBUG_BUILD=true && pnpm run build

# Linux/macOS
DEBUG_BUILD=true pnpm run build
```

## 调试构建特性

当设置 `DEBUG_BUILD=true` 环境变量时，构建会应用以下配置：

### 前端 (Vite) 配置

-   **禁用压缩**: `minify: false`
-   **生成 Source Map**: `sourcemap: true`
-   **保持现代语法**: `target: 'esnext'`
-   **禁用内部导出压缩**: `minifyInternalExports: false`
-   **保持代码格式**: `compact: false`

### 服务端 (Nitro) 配置

-   **禁用 ESBuild 压缩**: `minify: false`
-   **生成 Source Map**: `sourcemap: true`
-   **保持 ES 新特性**: `target: 'esnext'`

## 构建产物差异

### 普通构建 vs 调试构建

| 特性       | 普通构建 | 调试构建 |
| ---------- | -------- | -------- |
| 文件大小   | 小       | 大       |
| 变量名     | 混淆     | 保持原名 |
| 函数名     | 混淆     | 保持原名 |
| Source Map | 无       | 有       |
| 代码格式   | 压缩     | 格式化   |
| 调试友好度 | 低       | 高       |

### 文件结构示例

调试构建后，你会在 `.output` 目录中看到：

```
.output/
├── public/
│   ├── _nuxt/
│   │   ├── app.js         # 未压缩的应用代码
│   │   ├── app.js.map     # Source Map 文件
│   │   ├── vendor.js      # 未压缩的第三方库
│   │   └── vendor.js.map  # 第三方库 Source Map
│   └── ...
└── server/
    ├── index.mjs          # 未压缩的服务端代码
    ├── index.mjs.map      # 服务端 Source Map
    └── ...
```

## 使用场景

### 1. 生产环境问题排查

当生产环境出现问题时，可以构建调试版本进行部署：

```bash
# 构建调试版本
pnpm run build:debug

# 部署到测试环境
# ... 部署脚本
```

### 2. 性能分析

调试构建保留了原始的函数名和变量名，便于性能分析工具识别：

```bash
# 构建调试版本用于性能分析
DEBUG_BUILD=true pnpm run build
```

### 3. 错误追踪

配合 Sentry 等错误追踪工具，Source Map 可以提供准确的错误堆栈：

```javascript
// 在生产环境配置 Sentry 上传 Source Map
// 然后部署调试构建版本
```

## 注意事项

### 安全考虑

-   调试构建会暴露原始的变量名和函数名
-   Source Map 包含源代码信息
-   **不建议在公网生产环境使用调试构建**

### 性能影响

-   文件体积较大，加载时间较长
-   浏览器解析时间增加
-   内存占用较高

### 最佳实践

1. **仅在需要调试时使用**：平时使用普通构建，遇到问题时再使用调试构建
2. **使用专门的调试环境**：避免在生产环境直接使用调试构建
3. **及时清理**：调试完成后及时切换回普通构建
4. **配合监控工具**：结合 Source Map 和错误监控工具使用

## 高级配置

### 自定义 Source Map 类型

你可以在 `nuxt.config.ts` 中进一步自定义 Source Map 的生成方式：

```typescript
export default defineNuxtConfig({
    vite: {
        build: {
            sourcemap:
                process.env.DEBUG_BUILD === "true"
                    ? "source-map" // 生成独立的 .map 文件
                    : false,
        },
    },
});
```

Source Map 类型选项：

-   `'source-map'`: 生成独立的 .map 文件（推荐）
-   `'inline-source-map'`: 将 Source Map 内嵌到文件中
-   `'hidden-source-map'`: 生成 Source Map 但不在文件中引用
-   `true`: 默认行为，通常生成独立文件

### 条件性压缩

如果需要部分压缩（例如只保留变量名但压缩空格）：

```typescript
export default defineNuxtConfig({
    vite: {
        build: {
            minify:
                process.env.DEBUG_BUILD === "true"
                    ? "terser" // 使用 Terser 进行自定义压缩
                    : "esbuild",
            terserOptions:
                process.env.DEBUG_BUILD === "true"
                    ? {
                          mangle: false, // 不混淆变量名
                          compress: false, // 不压缩代码
                          format: {
                              beautify: true, // 保持代码格式
                          },
                      }
                    : undefined,
        },
    },
});
```

## 故障排除

### 构建失败

如果调试构建失败，请检查：

1. Node.js 版本是否满足要求（>= 18）
2. 依赖是否完整安装：`pnpm install`
3. TypeScript 配置是否正确
4. 内存是否充足（调试构建需要更多内存）

### Source Map 不生效

如果 Source Map 不生效：

1. 检查浏览器开发者工具是否启用了 Source Map
2. 确认 `.map` 文件是否正确生成
3. 检查服务器是否正确提供 `.map` 文件

### 文件过大

如果调试构建文件过大：

1. 考虑使用 `'hidden-source-map'` 模式
2. 排除不必要的第三方库 Source Map
3. 使用代码分割减少单个文件大小

## 结论

调试构建是排查生产环境问题的重要工具。通过合理使用调试构建配置，可以在保持开发效率的同时，确保生产环境问题能够快速定位和解决。

记住：调试构建应该作为问题排查的工具，而不是常规的生产部署方式。
