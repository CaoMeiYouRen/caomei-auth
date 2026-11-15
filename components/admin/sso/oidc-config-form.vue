<template>
    <section class="config-section">
        <h4 class="config-section__title">
            {{ t('admin.sso.oidc.title') }}
        </h4>

        <div class="config-section__fields">
            <BaseInputV2
                id="clientId"
                v-model="localModel.clientId"
                :label="t('admin.sso.oidc.clientId')"
                :placeholder="t('admin.sso.oidc.clientIdPlaceholder')"
                required
            />

            <BasePasswordV2
                id="clientSecret"
                v-model="localModel.clientSecret"
                :label="t('admin.sso.oidc.clientSecret')"
                :placeholder="t('admin.sso.oidc.clientSecretPlaceholder')"
                required
            />

            <BaseInputV2
                id="discoveryEndpoint"
                v-model="localModel.discoveryEndpoint"
                :label="t('admin.sso.oidc.discoveryUrl')"
                :hint="t('admin.sso.oidc.discoveryHint')"
                :placeholder="t('admin.sso.oidc.discoveryPlaceholder')"
            />

            <BaseInputV2
                id="authorizationEndpoint"
                v-model="localModel.authorizationEndpoint"
                :label="t('admin.sso.oidc.authorizationUrl')"
                :placeholder="t('admin.sso.oidc.authorizationPlaceholder')"
            />

            <BaseInputV2
                id="tokenEndpoint"
                v-model="localModel.tokenEndpoint"
                :label="t('admin.sso.oidc.tokenUrl')"
                :placeholder="t('admin.sso.oidc.tokenPlaceholder')"
            />

            <BaseInputV2
                id="userInfoEndpoint"
                v-model="localModel.userInfoEndpoint"
                :label="t('admin.sso.oidc.userinfoUrl')"
                :placeholder="t('admin.sso.oidc.userinfoPlaceholder')"
            />

            <BaseInputV2
                id="jwksEndpoint"
                v-model="localModel.jwksEndpoint"
                :label="t('admin.sso.oidc.jwksUrl')"
                :placeholder="t('admin.sso.oidc.jwksPlaceholder')"
            />

            <BaseInputV2
                id="scopes"
                :model-value="scopesInput"
                :label="t('admin.sso.oidc.scope')"
                :hint="t('admin.sso.oidc.scopeHint')"
                :placeholder="t('admin.sso.oidc.scopePlaceholder')"
                @update:model-value="updateScopesInput"
            />

            <CaomeiCheckbox
                id="pkce"
                v-model="localModel.pkce"
                :text="t('admin.sso.oidc.pkce')"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    modelValue: {
        clientId: string
        clientSecret: string
        discoveryEndpoint: string
        authorizationEndpoint: string
        tokenEndpoint: string
        userInfoEndpoint: string
        jwksEndpoint: string
        scopes: string[]
        pkce: boolean
    }
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: typeof props.modelValue): void
}>()

const { t } = useI18n()

// Create a local copy to avoid mutating prop
const localModel = ref({ ...props.modelValue })
const scopesInput = ref(props.modelValue.scopes.join(' '))

// Watch for prop changes to update local copy
watch(() => props.modelValue, (newVal) => {
    // Simple check to avoid infinite loops or unnecessary updates
    if (JSON.stringify(newVal) !== JSON.stringify(localModel.value)) {
        localModel.value = { ...newVal }
        scopesInput.value = newVal.scopes.join(' ')
    }
}, { deep: true })

// Watch for local changes to emit update
watch(localModel, (newVal) => {
    emit('update:modelValue', { ...newVal })
}, { deep: true })

function updateScopesInput(value: string) {
    scopesInput.value = value
    localModel.value.scopes = value
        .split(' ')
        .map((scope) => scope.trim())
        .filter((scope) => scope)
}
</script>

<style lang="scss" scoped>
.config-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--admin-border);

    &__title {
        margin: 0 0 1rem;
        color: var(--color-primary);
        font-size: 1.125rem;
        font-weight: 600;
    }

    &__fields {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }
}
</style>
