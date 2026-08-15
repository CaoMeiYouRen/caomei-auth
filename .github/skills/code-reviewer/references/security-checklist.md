# 安全与可靠性审查清单

## 输入/输出安全

- **XSS**：不安全的 HTML 注入、`dangerouslySetInnerHTML`、未转义模板、innerHTML 赋值
- **注入**：通过字符串拼接或模板字面量导致的 SQL/NoSQL/命令/GraphQL 注入
- **SSRF**：用户可控 URL 未经验证白名单就触达内部服务
- **路径穿越**：用户输入未消毒就用于文件路径（`../` 攻击）
- **原型污染**：不安全的 JavaScript 对象合并（`Object.assign`、带用户输入的 spread）

## 认证/授权（AuthN/AuthZ）

- 读写操作缺少租户或所有权检查
- 新端点没有认证守卫或 RBAC 强制
- 信任客户端提供的角色/标志/ID
- 破坏的访问控制（IDOR - 不安全的直接对象引用）
- 会话固定或弱会话管理

## JWT 与 Token 安全

- 算法混淆攻击（期望 `RS256` 时接受 `none` 或 `HS256`）
- 弱密钥或硬编码密钥
- 缺少 `exp`（过期时间）或未校验
- JWT 载荷中的敏感数据（token 是 base64，非加密）
- 未校验 `iss`（签发者）或 `aud`（受众）

## 密钥与个人隐私数据（PII）

- 代码/配置/日志中的 API key、token 或凭据
- git 历史中的密钥，或暴露给客户端的环境变量
- 过度记录 PII 或敏感载荷
- 错误消息中缺少数据脱敏

## 供应链与依赖

- 未锁定版本的依赖允许恶意更新
- 依赖混淆（私有包名冲突）
- 从不信任来源或 CDN 导入且无完整性校验
- 已知 CVE 的过时依赖
- **幻觉依赖**: import/require 的包真实存在？manifest 与代码引用一致——AI 推荐包约 20% 在官方 registry 不存在，安装前须查官方页
- **AI 推荐包来源验证**: 新引入包是否核验官方 registry 页与拼写（typosquatting），是否钉精确版本并提交锁文件
- **外部技能/agent/MCP 来源**: skills、AGENTS.md、.cursorrules、MCP server 的来源是否可信（TrustFall 伪装"有用文档"诱导信任），是否核对 repo URL 与维护组织

## AI 生成代码与 Agent/MCP 特化

AI 代码"能跑、测试过"不代表安全——Veracode 2025 实测 45% 的 AI 代码含 OWASP Top 10 漏洞（100+ LLM）。审查时按以下特化项检查：

- **授权缺失（最高频）**: 每个接口/工具调用都校验权限？AI 漏洞中授权缺失是最常见类型（OWASP A01）
- **注入与转义**: SQL/Shell 拼接是否参数化；输出是否转义（AI 代码 XSS 率 2.74x 人工——Veracode 2025，A03）
- **硬编码密钥**: 搜 api_key/password/token；密钥入 `.env` 不入库（AI 生成代码硬编码凭据更常见，A07）
- **配置与默认值**: 默认口令、CORS 宽松、调试模式上线？（A05）
- **输入验证**: 边界值/恶意输入/超大输入；LLM 应用另查 prompt injection（A03 + LLM01）
- **错误处理泄漏**: 异常是否泄漏内部路径/堆栈/SQL；catch 是否吞异常（A05）
- **日志审计**: 敏感数据是否进日志（A09）
- **Agent/MCP 特化**:
  - 工具 description 是否被注入指令（恶意仓库可诱导调用）
  - skills/AGENTS.md/.cursorrules 来源是否可信（上下文投毒入口）
  - MCP env 密钥是否只读不改；敏感配置有无写保护
  - 路径遍历：文件读取类工具是否防任意路径（`../`、绝对路径、符号链接）

## CORS 与响应头

- 过度宽松的 CORS（`Access-Control-Allow-Origin: *` 且带凭据）
- 缺少安全响应头（CSP、X-Frame-Options、X-Content-Type-Options）
- 暴露内部响应头或堆栈

## 运行时风险

- 无界循环、递归调用或大型内存缓冲
- 外部调用缺少超时、重试或限流
- 请求路径上的阻塞操作（async 上下文中的同步 I/O）
- 资源耗尽（文件句柄、连接、内存）
- ReDoS（正则表达式拒绝服务）

## 密码学

- 弱算法（安全用途的 MD5、SHA1）
- 硬编码 IV 或盐
- 无认证的加密（ECB 模式、无 HMAC）
- 密钥长度不足

## 竞态条件

竞态条件是导致间歇性故障与安全漏洞的隐蔽 bug。特别注意：

### 共享状态访问

- 多线程/goroutine/async 任务在无同步下访问共享变量
- 并发修改的全局状态或单例
- 无适当锁的懒初始化（双重检查锁定问题）
- 并发上下文中使用非线程安全集合

### 检查后行动（TOCTOU）

- `if (exists) then use` 模式无原子操作
- `if (authorized) then perform` 授权可能中途变化
- 文件存在性检查后紧跟文件操作
- 余额检查后紧跟扣款（金融操作）
- 库存检查后紧跟下单

### 数据库并发

- 缺少乐观锁（`version` 列、`updated_at` 检查）
- 缺少悲观锁（`SELECT FOR UPDATE`）
- 无事务隔离的读-改-写
- 无原子操作的计数器自增（`UPDATE SET count = count + 1`）
- 并发插入中的唯一约束冲突

### 分布式系统

- 共享资源缺少分布式锁
- 主节点选举竞态
- 缓存失效竞态（写后过期读）
- 无正确排序的事件顺序依赖
- 集群操作中的脑裂场景

### 需要标记的常见模式

```
# 危险模式：
if not exists(key):       # TOCTOU
    create(key)

value = get(key)          # 读-改-写
value += 1
set(key, value)

if user.balance >= amount:  # 检查后行动
    user.balance -= amount
```

### 应提出的问题

- "两个请求同时命中这段代码会发生什么？"
- "这个操作是原子的还是可被中断的？"
- "这段代码访问哪些共享状态？"
- "高并发下表现如何？"

## 数据完整性

- 缺少事务、部分写入或不一致的状态更新
- 持久化前弱校验（类型强制问题）
- 可重试操作缺少幂等性
- 并发修改导致的丢失更新
