import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, defineComponent } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import AppFooter from '@/components/app-footer.vue'
import { authClient } from '@/lib/auth-client'
import { useI18nText } from '@/tests/mocks/i18n-text'

/** `useI18n` 替身：组件内只用到 `t`，这里指向真实 zh-CN 语言包。 */
const i18nStub = vi.hoisted(() => ({ t: (key: string) => key }))
mockNuxtImport('useI18n', () => () => i18nStub)
i18nStub.t = useI18nText()

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(),
    },
}))

// Mock NuxtLink
const NuxtLinkStub = {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
}

// Helper to mount async component
const mountAsync = async (component: any, options: any = {}) => {
    const TestComponent = defineComponent({
        components: { TestTarget: component },
        template: '<Suspense><TestTarget /></Suspense>',
    })

    const wrapper = mount(TestComponent, {
        ...options,
        global: {
            ...options.global,
            stubs: {
                ...options.global?.stubs,
            },
            components: {
                TestTarget: component,
                ...options.global?.components,
            },
        },
    })

    await flushPromises()
    return wrapper.findComponent(component)
}

describe('AppFooter', () => {
    let originalConfig: any

    beforeEach(() => {
        vi.clearAllMocks()
        // Mock useFetch globally
        vi.stubGlobal('useFetch', vi.fn())

        // Capture original config
        const config = useRuntimeConfig()
        originalConfig = { ...config.public }
    })

    afterEach(() => {
    // Restore config
        const config = useRuntimeConfig()
        Object.assign(config.public, originalConfig)
    })

    it('renders basic links correctly', async () => {
        const mockSession = ref(null)
        vi.mocked(authClient.useSession).mockResolvedValue({
            data: mockSession,
            isPending: ref(false),
            error: ref(null),
        } as any)

        const wrapper = await mountAsync(AppFooter, {
            global: {
                stubs: {
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        expect(wrapper.text()).toContain('草梅 Auth © 2025')
        expect(wrapper.text()).toContain('统一登录平台')

        const links = wrapper.findAllComponents(NuxtLinkStub)
        const linkTexts = links.map((link) => link.text())

        expect(linkTexts).toContain('首页')
        expect(linkTexts).toContain('隐私政策')
        expect(linkTexts).toContain('服务条款')
        expect(linkTexts).toContain('关于我们')
        expect(linkTexts).toContain('联系我们')
        expect(linkTexts).toContain('项目文档')
    })

    it('shows user links when logged in', async () => {
        const mockSession = ref({
            user: {
                id: '1',
                email: 'test@example.com',
            },
            session: {},
        } as any)
        vi.mocked(authClient.useSession).mockResolvedValue({
            data: mockSession,
            isPending: ref(false),
            error: ref(null),
        } as any)

        const wrapper = await mountAsync(AppFooter, {
            global: {
                stubs: {
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        const links = wrapper.findAllComponents(NuxtLinkStub)
        const linkTexts = links.map((link) => link.text())

        expect(linkTexts).toContain('个人中心')
        expect(linkTexts).not.toContain('管理后台')
    })

    it('shows admin link when user is admin', async () => {
        const mockSession = ref({
            user: {
                id: '1',
                role: ['admin'],
            },
            session: {},
        } as any)
        vi.mocked(authClient.useSession).mockResolvedValue({
            data: mockSession,
            isPending: ref(false),
            error: ref(null),
        } as any)

        const wrapper = await mountAsync(AppFooter, {
            global: {
                stubs: {
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        const links = wrapper.findAllComponents(NuxtLinkStub)
        const linkTexts = links.map((link) => link.text())

        expect(linkTexts).toContain('管理后台')
    })

    async function mountAdminFooter() {
        const mockSession = ref({
            user: { id: '1', role: ['admin'] },
            session: {},
        } as any)
        vi.mocked(authClient.useSession).mockResolvedValue({
            data: mockSession,
            isPending: ref(false),
            error: ref(null),
        } as any)

        return mountAsync(AppFooter, {
            global: {
                stubs: {
                    NuxtLink: NuxtLinkStub,
                },
            },
        })
    }

    function footerTargets(wrapper: Awaited<ReturnType<typeof mountAdminFooter>>): unknown[] {
        return wrapper.findAllComponents(NuxtLinkStub).map((link) => link.props('to'))
    }

    it.each(['zh-TW', 'en-US'] as const)('%s 下站内链接保持当前语言，外链不变', async (locale) => {
        const { $i18n } = useNuxtApp()
        const externalTargets = footerTargets(await mountAdminFooter())
            .map(String)
            .filter((to) => /^(?:https?:|mailto:)/u.test(to))

        $i18n.locale.value = locale
        try {
            const targets = footerTargets(await mountAdminFooter())
            expect(targets).toContain(`/${locale}`)
            expect(targets).toContain(`/${locale}/profile`)
            expect(targets).toContain(`/${locale}/admin/users`)
            expect(targets).toContain(`/${locale}/forgot-password`)
            expect(targets).toContain(`/${locale}/privacy`)
            expect(targets).toContain(`/${locale}/terms`)
            expect(targets).toContain(`/${locale}/about`)
            expect(targets.some((to) => String(to).includes('/zh-CN/'))).toBe(false)

            const localizedExternalTargets = targets
                .map(String)
                .filter((to) => /^(?:https?:|mailto:)/u.test(to))
            expect(localizedExternalTargets.length).toBeGreaterThanOrEqual(2)
            expect(localizedExternalTargets.sort()).toEqual(externalTargets.sort())
            expect(localizedExternalTargets.some((to) => to.startsWith('mailto:'))).toBe(true)
        } finally {
            $i18n.locale.value = 'zh-CN'
        }
    })

    it('shows beian numbers when configured', async () => {
        const config = useRuntimeConfig()
        config.public.icpBeianNumber = 'ICP-123456'
        config.public.publicSecurityBeianNumber = 'PS-123456'

        const mockSession = ref(null)
        vi.mocked(authClient.useSession).mockResolvedValue({
            data: mockSession,
            isPending: ref(false),
            error: ref(null),
        } as any)

        const wrapper = await mountAsync(AppFooter, {
            global: {
                stubs: {
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        expect(wrapper.text()).toContain('ICP-123456')
        expect(wrapper.text()).toContain('PS-123456')
    })
})
