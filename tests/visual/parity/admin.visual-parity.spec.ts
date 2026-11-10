import { defineAdminVisualMatrix } from '../helpers/admin-matrix'

/**
 * Admin 视觉参考态（P4 迁移前原貌）用例入口。
 *
 * 采集命令：`pnpm test:visual:reference`；参考态只能在 P4 第一个页面迁移提交之前采集。
 * 采集后会随 `test/p4-visual-reference` 分支合入主分支，迁移批次用当前渲染与之比对。
 */
defineAdminVisualMatrix()
