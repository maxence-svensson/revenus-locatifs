<script setup lang="ts">
defineProps<{ messages: string[] }>()
</script>

<template>
  <ul v-if="messages.length" class="space-y-2">
    <li
      v-for="m in messages"
      :key="m"
      class="bg-attention-doux text-attention flex gap-2 rounded-xl px-3 py-2 text-sm"
    >
      <AppIcon nom="alerte" class="mt-0.5" />
      <span>{{ m }}</span>
    </li>
  </ul>
</template>
