import { createAuthClient } from 'better-auth/vue'
import { usernameClient, magicLinkClient, emailOTPClient, inferAdditionalFields, anonymousClient, phoneNumberClient, adminClient } from 'better-auth/client/plugins'
import type { auth } from './auth'

export const authClient = createAuthClient({
    /** 服务器的基础 URL（如果您使用相同域名，则可选） */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    plugins: [
        inferAdditionalFields<typeof auth>(),
        usernameClient(),
        magicLinkClient(),
        emailOTPClient(),
        anonymousClient(),
        phoneNumberClient(),
        adminClient(),
    ],
})
