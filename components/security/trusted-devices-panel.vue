<template>
    <div class="security-section trusted-devices">
        <h3 class="section-title">
            {{ t('security.trustedDevices.title') }}
        </h3>
        <p class="section-desc">
            {{ t('security.trustedDevices.desc') }}
        </p>

        <p
            v-if="loading && !devices.length"
            class="trusted-devices__state"
        >
            {{ t('security.trustedDevices.loading') }}
        </p>

        <div
            v-else-if="errorMessage"
            class="trusted-devices__error"
            role="alert"
        >
            <i class="mdi mdi-alert-circle-outline" aria-hidden="true" />
            <span>{{ errorMessage }}</span>
            <CaomeiButton
                variant="secondary"
                size="sm"
                @click="load"
            >
                {{ t('security.trustedDevices.retry') }}
            </CaomeiButton>
        </div>

        <p
            v-else-if="!devices.length"
            class="trusted-devices__state"
        >
            {{ t('security.trustedDevices.empty') }}
        </p>

        <ul
            v-else
            class="trusted-devices__list"
        >
            <li
                v-for="device in devices"
                :key="device.id"
                class="trusted-devices__item"
            >
                <div class="trusted-devices__main">
                    <i
                        class="mdi mdi-laptop"
                        aria-hidden="true"
                    />
                    <div>
                        <div class="trusted-devices__name">
                            {{ formatDevice(device.userAgent || '') || t('security.trustedDevices.unknownDevice') }}
                            <CaomeiTag
                                v-if="device.current"
                                tone="primary"
                                variant="soft"
                            >
                                {{ t('security.trustedDevices.currentDevice') }}
                            </CaomeiTag>
                        </div>
                        <div class="trusted-devices__ip">
                            {{ device.ip || '—' }}
                        </div>
                    </div>
                </div>
                <dl class="trusted-devices__meta">
                    <div>
                        <dt>{{ t('security.trustedDevices.createdAt') }}</dt>
                        <dd>{{ formatDateTimeShort(device.createdAt) }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('security.trustedDevices.lastUsedAt') }}</dt>
                        <dd>{{ formatDateTimeShort(device.lastUsedAt) }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('security.trustedDevices.expiresAt') }}</dt>
                        <dd>
                            {{ formatDateTimeShort(device.expiresAt) }}
                            <CaomeiTag
                                v-if="device.expired"
                                tone="danger"
                                variant="soft"
                            >
                                {{ t('security.trustedDevices.expired') }}
                            </CaomeiTag>
                        </dd>
                    </div>
                </dl>
                <CaomeiButton
                    variant="secondary"
                    size="sm"
                    :loading="revokingId === device.id"
                    :aria-label="`${t('security.trustedDevices.revoke')} ${formatDevice(device.userAgent || '') || t('security.trustedDevices.unknownDevice')}`"
                    @click="confirmRevoke(device)"
                >
                    {{ t('security.trustedDevices.revoke') }}
                </CaomeiButton>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useConfirm, useToast } from 'caomei-ui'
import { formatDevice } from '@/utils/web/device'
import { useLocaleDate } from '@/composables/use-locale-date'
import { getApiErrorMessage } from '@/utils/shared/api-error'

interface TrustedDeviceView {
    id: string
    userAgent: string | null
    ip: string | null
    createdAt: string
    expiresAt: string
    lastUsedAt: string
    expired: boolean
    current: boolean
}

interface TrustedDevicesResponse {
    status: boolean
    data: { devices: TrustedDeviceView[] }
}

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const { formatDateTimeShort } = useLocaleDate()

const devices = ref<TrustedDeviceView[]>([])
const loading = ref(false)
const errorMessage = ref('')
const revokingId = ref('')

const load = async () => {
    try {
        loading.value = true
        errorMessage.value = ''
        const response = await $fetch<TrustedDevicesResponse>('/api/security/trusted-devices')
        devices.value = response.data.devices
    } catch (error) {
        errorMessage.value = getApiErrorMessage(error, t('security.trustedDevices.loadFailed'))
    } finally {
        loading.value = false
    }
}

const confirmRevoke = async (device: TrustedDeviceView) => {
    const confirmed = await confirm.open({
        title: t('security.trustedDevices.confirmTitle'),
        description: t('security.trustedDevices.confirmDescription'),
        tone: 'danger',
    })
    if (!confirmed) {
        return
    }
    try {
        revokingId.value = device.id
        await $fetch(`/api/security/trusted-devices/${encodeURIComponent(device.id)}`, { method: 'DELETE' })
        toast.success({
            title: t('security.trustedDevices.revokeSuccess'),
            duration: 3000,
        })
        await load()
    } catch (error) {
        toast.danger({
            title: t('security.trustedDevices.revokeFailed'),
            description: getApiErrorMessage(error, t('security.trustedDevices.revokeFailed')),
            duration: 3000,
        })
    } finally {
        revokingId.value = ''
    }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.trusted-devices {
    &__state {
        color: var(--admin-muted);
    }

    &__error {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--admin-border);
        border-radius: 8px;
        color: var(--admin-text);
        background: var(--admin-surface-muted);
    }

    &__list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0;
        margin: 0;
        list-style: none;
    }

    &__item {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 0.9rem 1rem;
        border: 1px solid var(--admin-border);
        border-radius: 10px;
        background: var(--admin-surface);
    }

    &__main {
        display: flex;
        gap: 0.6rem;
        align-items: center;
        min-width: 12rem;

        > i {
            font-size: 1.5rem;
            color: var(--color-primary);
        }
    }

    &__name {
        font-weight: 600;
        color: var(--admin-text);
    }

    &__ip {
        color: var(--admin-muted);
        font-size: 0.85rem;
    }

    &__meta {
        display: flex;
        flex: 1;
        gap: 1.5rem;
        margin: 0;

        dt {
            color: var(--admin-muted);
            font-size: 0.75rem;
        }

        dd {
            display: flex;
            gap: 0.35rem;
            align-items: center;
            margin: 0;
            color: var(--admin-text);
            font-size: 0.85rem;
        }
    }
}

@media (width <= 768px) {
    .trusted-devices__item {
        flex-direction: column;
        align-items: flex-start;
    }

    .trusted-devices__meta {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>
