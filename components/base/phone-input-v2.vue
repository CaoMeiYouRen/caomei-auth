<template>
    <CaomeiFormItem
        :id="id"
        :label="label"
        :error="error"
        :required="required"
        :name="name"
    >
        <template #default="field">
            <div class="phone-input">
                <div class="region-selector">
                    <CaomeiSelect
                        v-model="region"
                        :options="options"
                        option-label="label"
                        option-value="value"
                        aria-label="国家/地区代码"
                        @update:model-value="formatPhone"
                    />
                </div>
                <CaomeiInput
                    :id="field.id"
                    v-model="phoneNumber"
                    class="phone-number-input"
                    :name="field.name"
                    :placeholder="placeholder"
                    :invalid="field.invalid"
                    :aria-labelledby="field['aria-labelledby']"
                    :aria-describedby="field['aria-describedby']"
                    v-bind="$attrs"
                    @update:model-value="formatPhone"
                />
            </div>
        </template>
    </CaomeiFormItem>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import pkg, { type RegionCode, type RegionCodeUnknown } from 'google-libphonenumber'
import { SUPPORTED_REGIONS, formatPhoneNumber, phoneUtil } from '@/utils/shared/phone'

const { PhoneNumberFormat } = pkg

defineOptions({
    inheritAttrs: false,
})

const props = withDefaults(defineProps<{
    id: string
    label?: string
    error?: string
    modelValue: string
    placeholder?: string
    defaultRegion?: string
    required?: boolean
    name?: string
}>(), {
    label: '',
    error: '',
    placeholder: '请输入手机号',
    defaultRegion: 'CN',
    required: false,
    name: '',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const options = SUPPORTED_REGIONS.map((item) => ({
    label: `${item.region} +${item.countryCode}`,
    value: item.region,
}))
const region = ref<RegionCode | RegionCodeUnknown>(props.defaultRegion as RegionCode)
const phoneNumber = ref('')

function formatPhone() {
    try {
        if (phoneNumber.value && region.value) {
            emit('update:modelValue', formatPhoneNumber(phoneNumber.value, region.value))
            return
        }
        emit('update:modelValue', '')
    } catch {
        emit('update:modelValue', '')
    }
}

watch(() => props.modelValue, (newValue) => {
    if (!newValue) {
        region.value = props.defaultRegion as RegionCode
        phoneNumber.value = ''
        return
    }
    try {
        const parsed = phoneUtil.parse(newValue)
        region.value = phoneUtil.getRegionCodeForNumber(parsed) || (props.defaultRegion as RegionCode)
        phoneNumber.value = phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL)
    } catch {
        region.value = props.defaultRegion as RegionCode
        phoneNumber.value = ''
    }
})
</script>

<style scoped lang="scss">
.phone-input {
    display: flex;
    gap: 0.5rem;
    width: 100%;
}

.region-selector {
    flex: 1;
    min-width: 0;

    :deep(.caomei-select) {
        width: 100%;
    }
}

.phone-number-input {
    flex: 3;
    min-width: 0;
}
</style>
