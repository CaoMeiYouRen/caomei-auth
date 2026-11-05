<template>
    <div class="language-switcher">
        <Select
            :model-value="locale"
            :options="options"
            option-label="label"
            option-value="value"
            :aria-label="t('language.label')"
            class="language-switcher__select"
            size="small"
            @update:model-value="onLocaleChange"
        />
    </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import type { LocaleCode } from '@/i18n/config/locale-registry'

const { t, locale, locales, setLocale } = useI18n()
const cookie = useCookie<string | null>('i18n_locale')
const toast = useToast()

const options = computed(() => locales.value.map((item) => ({
    label: typeof item.name === 'string' && item.name ? item.name : item.code,
    value: item.code,
})))

const onLocaleChange = async (code: string) => {
    const nextLocale = code as LocaleCode
    cookie.value = nextLocale
    await setLocale(nextLocale)
    toast.add({
        severity: 'success',
        summary: t('language.label'),
        detail: t(`language.${nextLocale}`),
        life: 2000,
    })
}
</script>

<style scoped lang="scss">
.language-switcher {
    display: inline-flex;
    align-items: center;

    .language-switcher__select {
        min-width: 7.5rem;
    }
}
</style>
