export function usePageMeta(title: string, description?: string) {
    const appName = '草梅 Auth'
    const fullTitle = computed(() => title ? `${title} - ${appName}` : appName)

    useHead({
        title: fullTitle,
        meta: [
            { name: 'description', content: description || title },
            { property: 'og:title', content: fullTitle },
            { property: 'og:description', content: description || title },
        ],
    })
}
