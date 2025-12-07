export function useStaticPageFlow() {
    const config = useRuntimeConfig().public
    const contactEmail = config.contactEmail
    const contactEmailLink = `mailto:${config.contactEmail}`

    return {
        contactEmail,
        contactEmailLink,
    }
}
