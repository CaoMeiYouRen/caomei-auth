<template>
    <CaomeiTooltip
        :delay-duration="delayDuration"
        :disabled="!content"
    >
        <CaomeiTooltipTrigger as-child unstyled>
            <slot />
        </CaomeiTooltipTrigger>
        <CaomeiTooltipContent
            v-if="content"
            :side="side"
            :side-offset="sideOffset"
        >
            {{ content }}
        </CaomeiTooltipContent>
    </CaomeiTooltip>
</template>

<script setup lang="ts">
/**
 * 统一 tooltip 封装：以 caomei-ui `CaomeiTooltip` 承载提示，避免回落到浏览器原生 `title`。
 *
 * 用法：把触发元素作为默认插槽（单个根节点），`content` 为空时不展示提示。
 *
 * 注意：
 * - 依赖根部的 `CaomeiTooltipProvider`（`app.vue`）；独立实例（如错误页以外的挂载点）需自行提供。
 * - 不转发 `class` / `$attrs`（Reka Trigger 只接管子节点属性），需要样式请加在插槽元素上。
 * - 表单字段内的提示只是补充信息；`BaseInputV2` 等封装让字段自身的 `aria-describedby`（错误 / hint）优先。
 */
withDefaults(defineProps<{
    /** 提示文本；为空时禁用提示 */
    content?: string
    /** 弹出方向 */
    side?: 'top' | 'right' | 'bottom' | 'left'
    /** 与触发器的偏移距离（px） */
    sideOffset?: number
    /** 覆盖全局延迟（ms）；缺省由 Provider 决定 */
    delayDuration?: number
}>(), {
    content: '',
    side: 'top',
    sideOffset: 6,
    delayDuration: undefined,
})
</script>
