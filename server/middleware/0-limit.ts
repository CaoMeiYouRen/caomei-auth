import { rateLimit } from '@/server/utils/rate-limit'
import { normalizeAuthPath } from '@/utils/shared/auth-paths'

export default defineEventHandler(async (event) => {
    /* 视觉夹具库一次跑 300+ 请求（多语言 × 多视口），会撞 60/分钟限流并让页面缺数据；
     * 固定渲染环境（容器内、仅 CI / 本地视觉任务）跳过限流，生产不受影响。 */
    if (process.env.VISUAL_HARNESS === '1' && process.env.DATABASE_PATH?.includes('.visual')) {
        return
    }
    // 限制 API 请求频率（使用归一化路径，避免点段路径绕过分支判断）
    const path = normalizeAuthPath(event.path)
    if (path.startsWith('/api')) {
        if (path.startsWith('/api/auth')) {
            // auth 路由的频率限制由 better-auth 提供，故此处不做处理
            return
        }
        if (path.startsWith('/api/file')) {
            // 限制 文件上传频率
            await rateLimit(event, {
                window: 60,
                max: 5,
            })
            return
        }
        // 如果是 POST/PATCH/PUT/DELETE 请求，限制为 20 次/分钟
        if (event.method === 'POST' || event.method === 'PATCH' || event.method === 'PUT' || event.method === 'DELETE') {
            await rateLimit(event, {
                window: 60,
                max: 20,
            })
            return
        }
        // 否则限制为 60 次/分钟
        await rateLimit(event, {
            window: 60,
            max: 60,
        })

    }
})
