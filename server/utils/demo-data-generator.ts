// import { randomBytes } from 'crypto'
import dayjs from 'dayjs'
import { maskEmail, maskPhone, maskIP } from '@/utils/privacy'
import type {
    DemoUser,
    DemoOAuthApplication,
    DemoLoginLog,
    DemoSSOProvider,
    DemoStats,
    DemoConfig,
} from '@/types/demo'
import { DEMO_PASSWORD, DEMO_MODE } from '@/utils/env'
import { formatPhoneNumber } from '@/utils/phone'
import { generateRandomString } from '@/utils/random'

/**
 * 生成随机日期范围
 */
function getRandomDate(daysAgo: number): Date {
    const now = new Date()
    const randomDays = Math.floor(Math.random() * daysAgo)
    const randomHours = Math.floor(Math.random() * 24)
    const randomMinutes = Math.floor(Math.random() * 60)
    return dayjs(now).subtract(randomDays, 'day').subtract(randomHours, 'hour').subtract(randomMinutes, 'minute').toDate()
}

/**
 * Demo 模式配置
 */
export const demoConfig: DemoConfig = {
    enabled: true,
    adminUser: {
        // id: 'demo_admin_001',
        username: 'demo_admin',
        name: '演示管理员',
        email: 'demo_admin@example.com',
        emailVerified: true,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        role: 'admin' as const,
        status: 'active' as const,
        createdAt: dayjs().subtract(180, 'day').toDate(),
        updatedAt: dayjs().subtract(1, 'day').toDate(),
        lastLoginAt: dayjs().subtract(1, 'hour').toDate(),
        phoneNumber: formatPhoneNumber('+86 199 8888 8888'),
        phoneNumberVerified: true,
    },
    normalUser: {
        // id: 'demo_user_001',
        username: 'demo_user',
        name: '演示用户',
        email: 'demo_user@example.com',
        emailVerified: true,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        role: 'user' as const,
        status: 'active' as const,
        createdAt: dayjs().subtract(90, 'day').toDate(),
        updatedAt: dayjs().subtract(2, 'day').toDate(),
        lastLoginAt: dayjs().subtract(2, 'hour').toDate(),
        phoneNumber: formatPhoneNumber ('+86 199 9999 9999'),
        phoneNumberVerified: true,
    },
    password: DEMO_PASSWORD,
}

/**
 * 生成假的用户数据
 */
export function generateDemoUsers(count: number = 50): DemoUser[] {
    const users: DemoUser[] = []

    const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗']
    const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞']
    const domains = ['example.com', 'demo.com', 'test.org', 'sample.net']

    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const name = `${firstName}${lastName}${i + 1}`
        const domain = domains[Math.floor(Math.random() * domains.length)]
        const email = `user${i + 1}@${domain}`
        const randomValue = Math.random()
        let status: 'active' | 'inactive' | 'suspended'
        if (randomValue > 0.1) {
            status = 'active'
        } else if (randomValue > 0.05) {
            status = 'inactive'
        } else {
            status = 'suspended'
        }

        users.push({
            id: snowflake.generateId(),
            name,
            email,
            emailVerified: Math.random() > 0.2,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            role: Math.random() > 0.95 ? 'admin' : 'user',
            status,
            createdAt: getRandomDate(365),
            updatedAt: getRandomDate(30),
            lastLoginAt: Math.random() > 0.3 ? getRandomDate(7) : undefined,
            phoneNumber: Math.random() > 0.4 ? `+86199${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}` : undefined,
            phoneNumberVerified: Math.random() > 0.3,
        })
    }

    return users
}

/**
 * 生成假的 OAuth 应用数据
 */
export function generateDemoOAuthApps(count: number = 20): DemoOAuthApplication[] {
    const appNames = [
        '草梅博客系统', '草梅商城', '草梅论坛', '草梅CMS', '草梅API网关',
        '团队协作平台', '项目管理系统', '客户关系管理', 'DevOps平台', '监控告警系统',
        '文档管理系统', '在线教育平台', '视频会议系统', '即时通讯工具', '文件存储服务',
        '数据分析平台', '报表系统', '工作流引擎', '支付网关', '短信服务平台',
    ]

    const descriptions = [
        '用于用户认证和授权的企业级应用',
        '提供完整的电商解决方案',
        '面向开发者的API服务平台',
        '企业内部管理系统',
        '第三方集成服务',
    ]

    const apps: DemoOAuthApplication[] = []

    for (let i = 0; i < count; i++) {
        const name = appNames[i] || `应用${i + 1}`
        const id = snowflake.generateId()
        apps.push({
            id,
            name,
            clientId: id,
            clientSecret: `demo_secret_${generateRandomString(16)}`,
            redirectUris: [
                `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.example.com/callback`,
                `https://localhost:3000/auth/callback`,
            ],
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            logo: `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`,
            scopes: ['openid', 'profile', 'email', ...(Math.random() > 0.5 ? ['phone'] : []), ...(Math.random() > 0.7 ? ['admin'] : [])],
            status: Math.random() > 0.2 ? 'active' : 'inactive',
            createdAt: getRandomDate(200),
            updatedAt: getRandomDate(30),
            authorizedUsers: Math.floor(Math.random() * 1000),
        })
    }

    return apps
}

/**
 * 生成假的登录日志数据
 */
export function generateDemoLoginLogs(count: number = 200): DemoLoginLog[] {
    const users = generateDemoUsers(20)
    // 生成完整的IP地址
    const generateRandomIP = () => {
        const ipRanges = [
            () => `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
            () => `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
            () => `172.${16 + Math.floor(Math.random() * 16)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
            () => `203.208.60.${Math.floor(Math.random() * 256)}`,
            () => `114.114.114.${Math.floor(Math.random() * 256)}`,
        ]
        return ipRanges[Math.floor(Math.random() * ipRanges.length)]()
    }
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ]
    const locations = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '武汉市', '成都市', '西安市', '重庆市']
    const methods = ['password', 'email', 'phone', 'oauth', 'sso'] as const
    const providers = ['github', 'google', 'microsoft', 'wechat', 'qq']
    const failureReasons = ['密码错误', '账号被锁定', '验证码错误', '账号不存在', '网络超时']

    const logs: DemoLoginLog[] = []

    for (let i = 0; i < count; i++) {
        const user = users[Math.floor(Math.random() * users.length)]
        const method = methods[Math.floor(Math.random() * methods.length)]
        const success = Math.random() > 0.15 // 85% 成功率
        const id = snowflake.generateId()
        logs.push({
            id,
            userId: user.id as string,
            userEmail: user.email,
            userName: user.name,
            ip: maskIP(generateRandomIP()),
            userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
            location: locations[Math.floor(Math.random() * locations.length)],
            loginMethod: method,
            provider: method === 'oauth' ? providers[Math.floor(Math.random() * providers.length)] : undefined,
            success,
            failureReason: !success ? failureReasons[Math.floor(Math.random() * failureReasons.length)] : undefined,
            createdAt: getRandomDate(30),
        })
    }

    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * 生成假的 SSO 提供商数据（连接到草梅 Auth 的应用）
 */
export function generateDemoSSOProviders(count: number = 10): DemoSSOProvider[] {
    const ssoApps = [
        { name: '企业办公系统', description: '内部员工办公管理系统' },
        { name: '人力资源管理', description: 'HR 系统，员工信息管理' },
        { name: '财务管理系统', description: '企业财务报表和账务管理' },
        { name: '客户关系管理', description: 'CRM 系统，客户信息管理' },
        { name: '项目管理平台', description: '团队协作和项目进度管理' },
        { name: '知识库系统', description: '企业内部知识分享平台' },
        { name: '销售管理系统', description: '销售流程和业绩管理' },
        { name: '库存管理系统', description: '仓库和库存信息管理' },
        { name: '运维监控平台', description: '服务器和应用监控系统' },
        { name: '企业邮箱系统', description: '内部邮件通讯系统' },
        { name: '视频会议系统', description: '在线会议和远程协作' },
        { name: '文档管理系统', description: '企业文档存储和版本管理' },
        { name: '数据分析平台', description: '业务数据统计和分析' },
        { name: '培训学习平台', description: '员工培训和学习管理' },
        { name: '审批流程系统', description: '企业内部审批和工作流' },
    ]

    const ssoProviders: DemoSSOProvider[] = []

    for (let i = 0; i < Math.min(count, ssoApps.length); i++) {
        const app = ssoApps[i]
        const id = snowflake.generateId()
        const appName = app.name.toLowerCase()
        ssoProviders.push({
            id,
            name: app.name,
            type: 'oidc' as const,
            providerId: `sso_${appName}`,
            clientId: snowflake.generateId(),
            clientSecret: `demo_secret_${generateRandomString(16)}`,
            issuerUrl: process.env.BASE_URL || 'https://auth.example.com',
            authorizationUrl: `${process.env.BASE_URL || 'https://auth.example.com'}/oauth/authorize`,
            tokenUrl: `${process.env.BASE_URL || 'https://auth.example.com'}/oauth/token`,
            userInfoUrl: `${process.env.BASE_URL || 'https://auth.example.com'}/oauth/userinfo`,
            scopes: ['openid', 'profile', 'email'],
            enabled: Math.random() > 0.2,
            logo: `https://api.dicebear.com/7.x/shapes/svg?seed=${app.name}`,
            description: app.description,
            createdAt: getRandomDate(100),
            updatedAt: getRandomDate(30),
            usersCount: Math.floor(Math.random() * 800) + 50,
        })
    }
    return ssoProviders
}

/**
 * 生成假的统计数据
 */
export function generateDemoStats(): DemoStats {
    const totalUsers = Math.floor(Math.random() * 10000) + 5000
    const activeUsers = Math.floor(totalUsers * (0.6 + Math.random() * 0.3))
    const totalLogins = Math.floor(totalUsers * (5 + Math.random() * 10))
    const todayLogins = Math.floor(activeUsers * (0.1 + Math.random() * 0.4))
    const totalOAuthApps = Math.floor(Math.random() * 50) + 20
    const activeOAuthApps = Math.floor(totalOAuthApps * (0.7 + Math.random() * 0.3))
    const totalSSOProviders = Math.floor(Math.random() * 15) + 5
    const activeSSOProviders = Math.floor(totalSSOProviders * (0.8 + Math.random() * 0.2))

    return {
        totalUsers,
        activeUsers,
        totalLogins,
        todayLogins,
        totalOAuthApps,
        activeOAuthApps,
        totalSSOProviders,
        activeSSOProviders,
    }
}

/**
 * 检查是否为 Demo 模式
 */
export function isDemoMode(): boolean {
    return DEMO_MODE
}

/**
 * 获取 Demo 模式配置
 */
export function getDemoConfig(): DemoConfig {
    return demoConfig
}
