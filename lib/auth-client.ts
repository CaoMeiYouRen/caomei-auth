import { createAuthClient } from 'better-auth/vue'
import { usernameClient, magicLinkClient, emailOTPClient, inferAdditionalFields, anonymousClient, phoneNumberClient, adminClient, genericOAuthClient, twoFactorClient, oidcClient } from 'better-auth/client/plugins'
import { ssoClient } from '@better-auth/sso/client'
import type { auth } from './auth'
import { AUTH_BASE_URL, MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_TEXT } from '@/utils/env'

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
        genericOAuthClient(),
        twoFactorClient({
            // onTwoFactorRedirect() {
            //     // 全局处理 2FA 验证
            // },
        }),
        oidcClient(),
        ssoClient(),
    ],
})
