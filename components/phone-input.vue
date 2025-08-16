<template>
    <div class="phone-input">
        <div class="region-selector">
            <Dropdown
                v-model="selectedRegion"
                class="form-dropdown"
                :options="options"
                option-label="label"
                :option-value="(option) => option"
                placeholder="选择区域"
                @change="handleRegionChange"
            />
        </div>
        <div class="phone-number-input">
            <InputText
                v-model="phoneNumber"
                class="form-input"
                :placeholder="placeholder"
                @input="formatPhone"
            />
        </div>
        <input
            type="hidden"
            :value="formattedPhoneNumber"
            @input="onInput"
        >
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import pkg from 'google-libphonenumber'
const { PhoneNumberFormat } = pkg
import { SUPPORTED_REGIONS, formatPhoneNumber, phoneUtil } from '@/utils/phone'

const props = defineProps({
    modelValue: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '请输入手机号',
    },
    defaultRegion: {
        type: String,
        default: 'CN',
    },
})

const emit = defineEmits(['update:modelValue'])

const supportedRegions = SUPPORTED_REGIONS
const options = supportedRegions.map((e) => ({
    label: `${e.region} +${e.countryCode}`,
    value: e.region,
}))
const selectedRegion = ref(options.find((region) => region.value === props.defaultRegion))
const phoneNumber = ref('')
const formattedPhoneNumber = ref('')

const handleRegionChange = () => {
    formatPhone()
}

const onInput = (event: any) => {
    emit('update:modelValue', event?.target?.value)
}

const formatPhone = () => {
    try {
        if (phoneNumber.value && selectedRegion.value) {
            formattedPhoneNumber.value = formatPhoneNumber(
                phoneNumber.value,
                selectedRegion.value.value as any,
            )
        } else {
            formattedPhoneNumber.value = ''
        }
        emit('update:modelValue', formattedPhoneNumber.value)
    } catch (error) {
        formattedPhoneNumber.value = ''
        emit('update:modelValue', '')
    }
}

watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        try {
            const phoneNumberObj = phoneUtil.parse(newValue)
            const regionCode = phoneUtil.getRegionCodeForNumber(phoneNumberObj)
            selectedRegion.value = options.find((region) => region.value === regionCode)
            phoneNumber.value = phoneUtil.format(phoneNumberObj, PhoneNumberFormat.NATIONAL)
            formattedPhoneNumber.value = newValue
        } catch (error) {
            selectedRegion.value = options.find((region) => region.value === props.defaultRegion)
            phoneNumber.value = ''
            formattedPhoneNumber.value = ''
        }
    } else {
        selectedRegion.value = options.find((region) => region.value === props.defaultRegion)
        phoneNumber.value = ''
        formattedPhoneNumber.value = ''
    }
})
</script>

<style scoped lang="scss">
@import url("@/styles/theme");
@import url("@/styles/form");
@import url("@/styles/common");

.phone-input {
    display: flex;
    width: 100%;

    .region-selector {
        flex: 1;

        .p-select {
            border-color: $secondary-bg;
            border-right: 0;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }
    }

    .phone-number-input {
        flex: 3;

        .p-inputtext {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }
    }

    .form-dropdown {
        padding: 2px;
        line-height: 1.5;
    }
}
</style>
