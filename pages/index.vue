<template>
    <div>
        {{ data.message }}
        <!-- <pre>{{ data }}</pre> -->
        <NuxtWelcome />
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const { data } = await useFetch('/api/test')

</script>
