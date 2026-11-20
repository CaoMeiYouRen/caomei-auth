import fs from 'node:fs'
import path from 'node:path'
import { LOGFILES, LOG_DIR } from '@/utils/shared/env'

/**
 * 审计事件落盘（独立文件 `audit-YYYY-MM-DD.log`）。
 *
 * 与运行日志分离，便于审计导出与保留策略独立配置；不引入 winston 依赖，
 * 避免 `logger.ts` 继续膨胀。写入失败只告警，不阻塞主流程。
 */
export function writeAuditRecord(entry: Record<string, unknown>): void {
    const line = `${JSON.stringify(entry)}\n`
    if (!LOGFILES) {
        console.info(line.trimEnd())
        return
    }
    try {
        const dir = path.isAbsolute(LOG_DIR) ? LOG_DIR : path.join(process.cwd(), LOG_DIR)
        fs.mkdirSync(dir, { recursive: true })
        const date = new Date().toISOString().slice(0, 10)
        fs.appendFileSync(path.join(dir, `audit-${date}.log`), line)
    } catch (error) {
        console.warn('Failed to write audit record', error)
    }
}
