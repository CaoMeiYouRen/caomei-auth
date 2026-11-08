# 2026-11-08 发布链路原生多架构评估（issue #718）

> **状态**：评估完成，**已排期**；2026-11-08 用户选择「立即插队阶段 3」+「方案 C：提取 reusable workflow」。已实现；`docker.yml` 构建 / merge 与 `docker-publish` rebuild / retag 已远端验证，`release` 与 deploy 复跑待完成。候选登记见 [backlog §3.3](../../plan/backlog.md#33-基础设施)。
> **来源**：[CaoMeiYouRen/caomei-auth#718](https://github.com/CaoMeiYouRen/caomei-auth/issues/718)（上游提案 `cmyr-skills-agents@fdda7ef`，能力 `docker-workflow` 的「原生多架构」子约定）。
> **核验基线**：`adfef8b`（2026-11-08）；工作流运行数据取自 GitHub Actions API。

## 1. 核验结果

| 入口 | 当前实现 | 结论 |
| :--- | :--- | :--- |
| `docker.yml` | `build` matrix：amd64 → `ubuntu-latest`，arm64 → `ubuntu-24.04-arm`；按 digest 推送；`merge` 合成 manifest；缓存 `type=gha,scope=<arch>` | **已原生**；M0-2 改为调用 `docker-build.yml`，架构 matrix / digest / merge 语义不变 |
| `release.yml` | `setup-qemu-action` + 单 job `platforms: linux/amd64,linux/arm64`；job 上限 90 分钟 | **需迁移** |
| `docker-publish.yml` `mode=retag` | 从 `sha-*` 复制 manifest，不重建 | **保持** |
| `docker-publish.yml` `mode=build` | 单个 `ubuntu-latest` + `platforms: linux/amd64,linux/arm64`，**无 QEMU / binfmt** | **需修复**：arm64 阶段无法执行 Dockerfile 的 `RUN pnpm i` / `pnpm run build` |
| `Dockerfile` | 构建阶段在容器内执行 `pnpm i` 与 `pnpm run build` | 放大了 QEMU / 跨架构执行问题 |

运行证据：

- `release.yml` 最近一次运行 [42371386469](https://github.com/CaoMeiYouRen/caomei-auth/actions/runs/42371386469)：semantic-release 成功后，`Build and push Docker images` 于 90 分钟上限被取消（12:11:45 → 13:42:22）。
- 上一次成功 release [40093337411](https://github.com/CaoMeiYouRen/caomei-auth/actions/runs/40093337411)：整体 31 分钟。
- `docker.yml` 原生 matrix [42370268641](https://github.com/CaoMeiYouRen/caomei-auth/actions/runs/42370268641)：arm64 build job 22 秒、amd64 24 秒，工作流总计约 5 分钟。
- `docker-publish.yml` 最近一次 [40510988460](https://github.com/CaoMeiYouRen/caomei-auth/actions/runs/40510988460)：走 `retag`，`build` 路径未被真实验证。

**判断**：release 的镜像发布已出现真实超时失败，不只是优化项；`docker-publish` 的补发重建路径是未验证的坏路径。按 [AGENTS.md §5.1.2](../../../AGENTS.md#51-迭代中途发现事项处理规则)，「阻塞当前交付 / 明确功能回归」可作为插队依据，但排期仍需用户裁定。

## 2. 方案比较

| 方案 | 做法 | 优点 | 代价 / 风险 |
| :--- | :--- | :--- | :--- |
| A 同 workflow 内 matrix + merge | `release.yml` / `docker-publish.yml` 各自拆 `build` + `merge` | 自包含；无跨工作流派发 | 三处重复 matrix / merge 逻辑 |
| B release 派发 `docker.yml` | release 后 `workflow_dispatch` 镜像工作流并传入版本 | 复用单一构建实现（dependfix 模式） | `docker.yml` 需新增 ref / 版本输入并跳过重复测试；跨工作流失败回传复杂 |
| **C 提取 reusable workflow（已采纳）** | 新建 `docker-build.yml`（`workflow_call`），`docker.yml` / `release.yml` / `docker-publish.yml` 调用；调用方只保留触发、tag 策略、部署差异 | 消除重复；三个入口行为一致；长期维护成本最低 | 需显式映射 4 个 secrets 并声明 `permissions`；`docker.yml` 需从内联改为调用（结构语义不变） |

## 3. 实施方案（方案 C）

- **复用工作流** `.github/workflows/docker-build.yml`：`build` matrix（amd64 → `ubuntu-latest`，arm64 → `ubuntu-24.04-arm`，缓存 `type=gha,scope=caomei-auth-<arch>`）→ 按 digest 推送 → `merge` 用 `metadata-action` 生成 tag 并 `imagetools create` 合成。
- **`docker.yml`**：`test` / `gate` 后调用复用工作流（latest / 日期 / `sha-*`），README 同步与 Jenkins 部署保留在独立 `deploy` job，顺序不变。
- **`release.yml`**：`release` job 输出 `git_tag` / `version` / `short_sha`；新增 `docker` job 调用复用工作流（semver / latest / 日期 / `sha-*`），无 tag 时跳过；QEMU 步骤删除。`sha-*` 改为指向 tag 提交（改造前为触发 SHA，属行为修正）。
- **`docker-publish.yml`**：拆 `prepare` / `retag` / `docker` / `verify`；`retag` 默认路径与行为不变；`mode=build` 调用复用工作流并传入 tag commit 的 `sha`（避免用触发 SHA 生成 `sha-*`）。
- **多 registry**：各架构只向 Docker Hub 按 digest 推送；`merge` 登录 GHCR / ACR 后用 `imagetools create` 跨 registry 复制；复用工作流注释已写明「不以单 digest 跨 registry 复用」。
- **ACR**：保持 `provenance:false`（`sbom` 默认关闭）；GHCR / Docker Hub 不额外增加 attestation。
- **失败语义**：任一架构失败则 merge 不执行；arm runner 不可用时失败并暴露，不静默降级。
- **日期 tag 语义**：`release.yml` / `docker.yml` 取构建当天；`docker-publish.yml` 的 `mode=build` 与 `retag` 均取 tag 提交日期，与改造前一致。
- **验证**：`imagetools inspect` 检查 amd64 + arm64；保留现有 Jenkins 部署顺序；arm64 运行时冒烟暂不作为必过项。
- **回滚**：回退 workflow 提交并重跑；补发优先 `retag`；QEMU 不作为长期回滚路径。

## 4. 决策记录

| 项 | 结论 |
| :--- | :--- |
| 排期 | **立即插队阶段 3**（M0 批次，不计入 6 条主线）；依据 release 镜像发布已超时失败 |
| release 拓扑 | **方案 C：复用 `docker-build.yml`** |
| 补发路径 | `retag` 保持；`mode=build` 调用同一复用工作流（不采用「先触发 docker.yml 再 retag」） |
| 验证强度 | `imagetools inspect` + 全量 lint / typecheck / test / build；arm64 运行时冒烟另行评估 |

> 本地无法执行 GitHub Actions；工作流语义需推送后由 `docker.yml` push 或 `workflow_dispatch` 验证，未验证前 `todo.md` 的 M0 条目不标完成。

## 5. 验收要点

- `release.yml` 主路径无 `setup-qemu-action`；复用工作流的 `build` matrix 明确 amd64 / arm64 原生 runner。
- `docker-publish.yml` `mode=build` 不再在单 amd64 runner 上构建 arm64；`mode=retag` 行为不变。
- `docker.yml` 调用复用工作流后，latest / 日期 / `sha-*`、README 同步与 Jenkins 部署顺序不变。
- 版本 tag、`latest`、日期 tag、`sha-*` 指向同一多架构 manifest；三 registry 平台集合一致。
- 每架构独立缓存 scope；任一架构失败不产出单架构 `latest`。
- 全量 lint / typecheck / test / build 与现有发布链顺序不变。

### 5.1 本地验证（2026-11-08）

| 项 | 结果 |
| :--- | :--- |
| YAML 语法 | 4 个 workflow 均通过 `yaml.safe_load` |
| 去 QEMU | `.github/workflows` 中无 `setup-qemu-action`、无单 job `platforms: linux/amd64,linux/arm64` |
| `pnpm lint` | 0 error / 28 warning（均在未改动测试文件，既有基线） |
| `pnpm lint:css` | 通过 |
| `pnpm typecheck` | 通过 |
| `pnpm test` | 124 文件 / 917 用例通过 |
| `pnpm build` | 通过（约 1m22s） |
| GitHub Actions 语义 | 历史快照：本地无法执行；远端结果见 §5.2 |

### 5.2 远端验证（2026-11-08）

| 入口 | 运行 | 结果 |
| :--- | :--- | :--- |
| `docker.yml`（push） | [42460267112](https://github.com/CaoMeiYouRen/caomei-auth/actions/runs/42460267112) | Test / gate / Build (amd64) / Build (arm64) / Publish multi-arch manifests 全部通过；GHCR / ACR 的 `sha-491debf`、`latest`、`2026-11-08` 指向同一 digest `sha256:4b8a814c…`，含 `linux/amd64` + `linux/arm64` |
| `docker.yml` Deploy | 同上 | **失败**：拆分 deploy 作业后工作区为空，`sync-readme` 报 `README.md` 不存在；已在 `958a2a7` 补回 checkout，待推送复跑 |
| `docker-publish`（`rebuild=true`，v1.16.0） | [42461119392](https://github.com/CaoMeiYouRen/caomei-auth/actions/runs/42461119392) | Prepare → Build amd64/arm64 → merge → Verify 全部通过；`1.16.0` 与 `2026-11-07`（tag 提交日）指向同一 digest，含双平台；retag 正确跳过 |
| `docker-publish`（`rebuild=false`，source=`sha-c27806a`） | [42461601204](https://github.com/CaoMeiYouRen/caomei-auth/actions/runs/42461601204) | Retag 与 Verify 通过，Docker 构建正确跳过；`retag` 默认路径行为不变 |
| `release.yml` | 未运行 | 会触发 semantic-release 正式发版，需用户确认后单独验证 |

> 复用工作流的 `tags` 输出被 GitHub 标记为「may contain secret」并跳过，已移除该未使用输出，避免误导。
> Docker Hub 在本机网络不可达，三 registry 中仅复核了 GHCR / ACR；Docker Hub 由 merge 日志确认已推送。

## 6. 关联

- [issue #718](https://github.com/CaoMeiYouRen/caomei-auth/issues/718)｜[上游提案](https://github.com/CaoMeiYouRen/cmyr-skills-agents/blob/fdda7ef/docs/proposals/2026-11-07-native-multiarch-docker.md)
- [backlog §3.3](../../plan/backlog.md#33-基础设施)｜[阶段 3 登记记录](./2026-11-06-phase3-registration.md)｜[开发规范](../../standards/development.md)
