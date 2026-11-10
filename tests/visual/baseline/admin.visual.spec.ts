import { defineAdminVisualMatrix } from '../helpers/admin-matrix'

/**
 * Admin 视觉自基线（当前已接受状态）用例入口。
 *
 * 更新命令：`pnpm test:visual:update`；更新前必须完成差异归因并写入迁移记录。
 */
defineAdminVisualMatrix()
