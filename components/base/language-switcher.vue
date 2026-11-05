<template>
    <div
        ref="root"
        class="language-switcher"
        :class="{'language-switcher--compact': compact}"
    >
        <button
            ref="trigger"
            type="button"
            class="language-switcher__trigger"
            :aria-label="t('language.label')"
            :title="t('language.label')"
            aria-haspopup="listbox"
            :aria-expanded="open"
            @click="toggle"
        >
            <i class="language-switcher__icon mdi mdi-translate" aria-hidden="true" />
            <span v-if="!compact" class="language-switcher__code">{{ t('language.short') }}</span>
            <i
                v-if="!compact"
                class="language-switcher__chevron mdi mdi-chevron-down"
                :class="{'language-switcher__chevron--open': open}"
                aria-hidden="true"
            />
        </button>

        <ul
            v-if="open"
            class="language-switcher__menu"
            role="listbox"
            :aria-label="t('language.label')"
        >
            <li
                v-for="item in options"
                :key="item.value"
            >
                <button
                    type="button"
                    class="language-switcher__option"
                    :class="{'language-switcher__option--active': item.value === locale}"
                    role="option"
                    :aria-selected="item.value === locale"
                    @click="selectLocale(item.value)"
                >
                    <span class="language-switcher__option-label">{{ item.label }}</span>
                    <i
                        v-if="item.value === locale"
                        class="language-switcher__option-check mdi mdi-check"
                        aria-hidden="true"
                    />
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { LocaleCode } from '@/i18n/config/locale-registry'

interface Props {
    /** 只显示图标（侧边栏折叠时使用） */
    compact?: boolean
}

withDefaults(defineProps<Props>(), {
    compact: false,
})

const { t, locale, locales, setLocale } = useI18n()
const cookie = useCookie<string | null>('i18n_locale')
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)

const options = computed(() => locales.value.map((item) => ({
    label: typeof item.name === 'string' && item.name ? item.name : item.code,
    value: item.code as LocaleCode,
})))

const toggle = () => {
    open.value = !open.value
}

const close = () => {
    open.value = false
}

const selectLocale = async (code: LocaleCode) => {
    close()
    if (code === locale.value) {
        return
    }
    cookie.value = code
    await setLocale(code)
}

const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open.value) {
        close()
        trigger.value?.focus()
    }
}

onClickOutside(root, close)
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped lang="scss">
.language-switcher {
    position: relative;
    display: inline-flex;
}

.language-switcher__trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--p-content-border-color);
    border-radius: 999px;
    background: var(--p-surface-0);
    color: var(--p-text-color);
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.08);
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

    &:hover {
        border-color: var(--p-primary-color);
        box-shadow: 0 4px 12px rgb(0 0 0 / 0.12);
        transform: translateY(-1px);
    }

    &:focus-visible {
        outline: 2px solid var(--p-primary-color);
        outline-offset: 2px;
    }
}

.language-switcher__icon {
    font-size: 1.125rem;
    color: var(--p-primary-color);
}

.language-switcher__code {
    letter-spacing: 0.02em;
}

.language-switcher__chevron {
    font-size: 1rem;
    opacity: 0.6;
    transition: transform 0.2s ease;

    &--open {
        transform: rotate(180deg);
    }
}

.language-switcher__menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 1200;
    min-width: 10.5rem;
    margin: 0;
    padding: 4px;
    border: 1px solid var(--p-content-border-color);
    border-radius: 12px;
    background: var(--p-surface-0);
    box-shadow: 0 12px 28px rgb(0 0 0 / 0.16);
    list-style: none;
}

.language-switcher__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--p-text-color);
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
        background: var(--p-surface-100);
    }

    &:focus-visible {
        outline: 2px solid var(--p-primary-color);
        outline-offset: -2px;
    }

    &--active {
        color: var(--p-primary-color);
        font-weight: 600;
    }
}

.language-switcher__option-check {
    font-size: 1rem;
}

.language-switcher--compact {
    .language-switcher__trigger {
        width: 36px;
        padding: 0;
        justify-content: center;
    }

    .language-switcher__menu {
        right: auto;
        left: 0;
    }
}
</style>
