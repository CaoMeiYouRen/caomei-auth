<template>
    <div class="login-events">
        <div class="events-header">
            <div>
                <h2 class="section-title">
                    {{ t('admin.logs.events.sectionTitle') }}
                </h2>
                <p class="section-description">
                    {{ t('admin.logs.events.description') }}
                </p>
            </div>
            <div class="events-title">
                {{ t('admin.logs.events.title', {count: total}) }}
            </div>
        </div>

        <div class="events-filters">
            <div class="filter-item">
                <CaomeiSelect
                    :model-value="typeFilter ?? null"
                    :options="typeOptions"
                    option-label="label"
                    option-value="value"
                    :label="t('admin.logs.events.typeLabel')"
                    :placeholder="t('admin.logs.events.typePlaceholder')"
                    show-clear
                    @update:model-value="onTypeChange"
                />
            </div>
            <div class="filter-item">
                <CaomeiSelect
                    :model-value="resultFilter ?? null"
                    :options="resultOptions"
                    option-label="label"
                    option-value="value"
                    :label="t('admin.logs.events.resultLabel')"
                    :placeholder="t('admin.logs.events.resultPlaceholder')"
                    show-clear
                    @update:model-value="onResultChange"
                />
            </div>
            <div class="filter-item">
                <CaomeiSelect
                    :model-value="channelFilter ?? null"
                    :options="channelOptions"
                    option-label="label"
                    option-value="value"
                    :label="t('admin.logs.events.channelLabel')"
                    :placeholder="t('admin.logs.events.channelPlaceholder')"
                    show-clear
                    @update:model-value="onChannelChange"
                />
            </div>
            <div class="filter-item filter-item--ip">
                <CaomeiInput
                    v-model="ipFilter"
                    :label="t('admin.logs.events.ipLabel')"
                    :placeholder="t('admin.logs.events.ipPlaceholder')"
                    clearable
                    @update:model-value="onIpChange"
                >
                    <template #prefix>
                        <i class="mdi mdi-ip-network-outline" aria-hidden="true" />
                    </template>
                </CaomeiInput>
            </div>
            <div class="filter-item filter-item--range">
                <CaomeiDatePicker
                    v-model="dateRange"
                    selection-mode="range"
                    :placeholder="t('admin.logs.events.dateRangePlaceholder')"
                    :label="t('admin.logs.events.dateRangeLabel')"
                />
                <CaomeiButton
                    v-if="dateRange"
                    icon-only
                    variant="ghost"
                    :label="t('admin.logs.events.clearDateRange')"
                    @click="dateRange = null"
                >
                    <template #icon>
                        <i class="mdi mdi-close" aria-hidden="true" />
                    </template>
                </CaomeiButton>
            </div>
            <CaomeiButton
                icon-only
                variant="secondary"
                :label="t('admin.logs.events.refresh')"
                @click="reload"
            >
                <template #icon>
                    <i class="mdi mdi-refresh" aria-hidden="true" />
                </template>
            </CaomeiButton>
        </div>

        <div
            v-if="errorMessage"
            class="events-error"
            role="alert"
        >
            <i class="mdi mdi-alert-circle-outline" aria-hidden="true" />
            <span>{{ errorMessage }}</span>
            <CaomeiButton
                variant="secondary"
                size="sm"
                @click="reload"
            >
                {{ t('admin.logs.events.retry') }}
            </CaomeiButton>
        </div>

        <CaomeiDataTable
            :data="data"
            :columns="columns"
            row-key="id"
            :loading="loading"
            paginator
            lazy
            :rows="pageSize"
            :rows-per-page-options="[10, 20, 25, 50]"
            :total-records="total"
            :page="page + 1"
            :sort-field="sortField"
            :sort-order="sortOrder"
            :empty-text="errorMessage ? '' : t('admin.logs.events.empty')"
            @page="onTablePage"
            @sort="onTableSort"
            @update:rows="onRowsChange"
        >
            <template #cell-type="{row}">
                <CaomeiTag
                    :tone="row.type === 'sign_in_failure' || row.type === 'two_factor_failure' ? 'danger' : 'neutral'"
                    variant="soft"
                >
                    {{ typeLabel(row.type) }}
                </CaomeiTag>
            </template>

            <template #cell-result="{row}">
                <CaomeiTag
                    :tone="row.result === 'success' ? 'success' : 'danger'"
                    variant="soft"
                >
                    {{ resultLabel(row.result) }}
                </CaomeiTag>
            </template>

            <template #cell-channel="{row}">
                {{ channelLabel(row.channel) }}
            </template>

            <template #cell-userId="{row}">
                <NuxtLink
                    v-if="row.userId"
                    :to="`/admin/users?userId=${encodeURIComponent(row.userId)}`"
                    class="user-link"
                    :title="row.userId"
                >
                    {{ row.userId }}
                </NuxtLink>
                <span
                    v-else
                    class="user-unknown"
                >
                    {{ t('admin.logs.events.unknownUser') }}
                </span>
            </template>

            <template #cell-userAgent="{row}">
                <span
                    class="user-agent"
                    :title="row.userAgent || undefined"
                >
                    {{ row.userAgent || t('admin.logs.events.unknownUserAgent') }}
                </span>
            </template>

            <template #cell-ip="{row}">
                <span class="ip-cell">{{ row.ip || t('admin.logs.events.unknownIp') }}</span>
            </template>
        </CaomeiDataTable>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataTableColumn, DataTablePageEvent, DataTableSortEvent } from 'caomei-ui'
import { useLoginEvents } from '@/composables/admin/use-login-events'
import { useLocaleDate } from '@/composables/use-locale-date'
import {
    LOGIN_EVENT_CHANNELS,
    LOGIN_EVENT_RESULTS,
    LOGIN_EVENT_TYPES,
    type LoginEventChannel,
    type LoginEventResult,
    type LoginEventType,
} from '@/utils/shared/login-events'
import type { LoginEventView } from '@/utils/shared/api-schemas'

const { t } = useI18n()
const { formatDateTimeShort } = useLocaleDate()

const {
    loading,
    data,
    total,
    page,
    pageSize,
    sortField,
    sortOrder,
    typeFilter,
    resultFilter,
    channelFilter,
    ipFilter,
    dateRange,
    errorMessage,
    onPage,
    onRowsChange,
    onSort,
    reload,
    onIpChange,
} = useLoginEvents()

const EVENT_TYPE_LABEL_KEYS: Record<LoginEventType, string> = {
    sign_in_success: 'types.signInSuccess',
    sign_in_failure: 'types.signInFailure',
    two_factor_challenge: 'types.twoFactorChallenge',
    two_factor_success: 'types.twoFactorSuccess',
    two_factor_failure: 'types.twoFactorFailure',
    sign_out: 'types.signOut',
    session_revoked: 'types.sessionRevoked',
}

const CHANNEL_LABEL_KEYS: Record<LoginEventChannel, string> = {
    email: 'channels.email',
    username: 'channels.username',
    phone: 'channels.phone',
    'email-otp': 'channels.emailOtp',
    'phone-otp': 'channels.phoneOtp',
    'magic-link': 'channels.magicLink',
    'email-verification': 'channels.emailVerification',
    social: 'channels.social',
    sso: 'channels.sso',
    unknown: 'channels.unknown',
}

function typeLabel(type: LoginEventType) {
    return t(`admin.logs.events.${EVENT_TYPE_LABEL_KEYS[type]}`)
}

function resultLabel(result: LoginEventResult) {
    return t(`admin.logs.events.results.${result}`)
}

function channelLabel(channel: LoginEventChannel) {
    return t(`admin.logs.events.${CHANNEL_LABEL_KEYS[channel]}`)
}

const typeOptions = computed(() => LOGIN_EVENT_TYPES.map((type) => ({ label: typeLabel(type), value: type })))
const resultOptions = computed(() => LOGIN_EVENT_RESULTS.map((result) => ({ label: resultLabel(result), value: result })))
const channelOptions = computed(() => LOGIN_EVENT_CHANNELS.map((channel) => ({ label: channelLabel(channel), value: channel })))

const columns = computed<DataTableColumn<LoginEventView>[]>(() => [
    {
        key: 'createdAt',
        header: t('admin.logs.events.columns.time'),
        width: '180px',
        accessor: (row) => formatDateTimeShort(row.createdAt),
    },
    { key: 'type', header: t('admin.logs.events.columns.type'), width: '170px' },
    { key: 'result', header: t('admin.logs.events.columns.result'), width: '110px' },
    { key: 'channel', header: t('admin.logs.events.columns.channel'), width: '140px' },
    { key: 'userId', header: t('admin.logs.events.columns.user'), width: '180px' },
    { key: 'ip', header: t('admin.logs.events.columns.ip'), width: '150px' },
    { key: 'userAgent', header: t('admin.logs.events.columns.userAgent') },
])

function onTypeChange(value: string | number | null | undefined) {
    typeFilter.value = typeof value === 'string' ? value as LoginEventType : undefined
}

function onResultChange(value: string | number | null | undefined) {
    resultFilter.value = typeof value === 'string' ? value as LoginEventResult : undefined
}

function onChannelChange(value: string | number | null | undefined) {
    channelFilter.value = typeof value === 'string' ? value as LoginEventChannel : undefined
}

function onTablePage(event: DataTablePageEvent) {
    onPage({ page: event.first / event.rows, rows: event.rows })
}

function onTableSort(event: DataTableSortEvent) {
    if (!event.sortField || !event.sortOrder) {
        return
    }
    onSort({ sortField: event.sortField, sortOrder: event.sortOrder === 'asc' ? 1 : -1 })
}
</script>

<style lang="scss" scoped>
.login-events {
    --caomei-color-text: var(--admin-text);
    --caomei-data-table-head-bg: var(--admin-surface-muted);
    --caomei-data-table-border: var(--admin-border);

    background: var(--admin-surface);
    border-radius: 12px;
    box-shadow: var(--admin-shadow);
    margin-bottom: 2rem;
    overflow: hidden;
}

.events-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid var(--admin-border);
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--admin-text);
    margin: 0;
}

.section-description {
    margin: 0.35rem 0 0;
    color: var(--admin-text-muted);
    font-size: 0.9rem;
}

.events-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--admin-text);
    white-space: nowrap;
}

.events-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
    padding: 1rem 2rem;

    .filter-item {
        min-width: 10rem;

        &--ip {
            min-width: 14rem;
            flex: 1;
        }

        &--range {
            display: flex;
            gap: 0.25rem;
            align-items: center;
        }
    }
}

.events-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 2rem 1rem;
    padding: 0.65rem 1rem;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    color: var(--admin-text);
    background: var(--admin-surface-muted);
}

.user-link {
    display: inline-block;
    max-width: 10rem;
    overflow: hidden;
    color: var(--admin-accent);
    text-decoration: underline;
    text-overflow: ellipsis;
    text-underline-offset: 2px;
    vertical-align: bottom;
    white-space: nowrap;
}

.user-unknown,
.user-agent {
    color: var(--admin-text-muted);
}

.user-agent {
    display: block;
    max-width: 22rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ip-cell {
    white-space: nowrap;
}

@media (width <= 768px) {
    .events-header {
        flex-direction: column;
        padding: 1rem;
    }

    .events-filters {
        flex-direction: column;
        align-items: stretch;
        padding: 1rem;

        .filter-item {
            min-width: 0;
        }
    }

    .events-error {
        margin: 0 1rem 1rem;
    }
}
</style>
