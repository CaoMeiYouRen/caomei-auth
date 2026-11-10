import { defineAuthVisualMatrix } from '../helpers/auth-matrix'

/**
 * 视觉参考态（迁移前原貌）用例入口。
 *
 * 不要用本文件采集「迁移后」参考态；参考态只能在自己的迁移提交之前采集。
 * 采集命令：`pnpm test:visual:reference`（带 VISUAL_REFERENCE_CAPTURE 守卫）。
 */
defineAuthVisualMatrix()
