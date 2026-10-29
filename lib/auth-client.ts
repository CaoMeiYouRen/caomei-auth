import { createAuthClient } from 'better-auth/vue'
import { usernameClient, magicLinkClient, emailOTPClient, inferAdditionalFields, anonymousClient, phoneNumberClient, adminClient, twoFactorClient } from 'better-auth/client/plugins'
import { oauthProviderClient } from '@better-auth/oauth-provider/client'
import { ssoClient } from '@better-auth/sso/client'
import type { auth } from './auth'
import { AUTH_BASE_URL } from '@/utils/shared/env'

export const authClient = createAuthClient({
    /** 服务器的基础 URL（如果您使用相同域名，则可选） */
    baseURL: AUTH_BASE_URL,
    plugins: [
        inferAdditionalFields<typeof auth>(),
        usernameClient(),
        magicLinkClient(),
        emailOTPClient(),
        anonymousClient(),
        phoneNumberClient(),
        adminClient(),
        twoFactorClient({
            // onTwoFactorRedirect() {
            //     // 全局处理 2FA 验证
            // },
        }),
        // OAuth Provider 客户端：为 oauth2 相关 POST 请求附加签名过的 oauth_query
        oauthProviderClient(),
        ssoClient(),
    ],
})
