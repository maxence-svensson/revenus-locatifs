<script setup lang="ts">
defineProps<{
  nom:
    | 'maison'
    | 'crayon'
    | 'balance'
    | 'livre'
    | 'plus'
    | 'croix'
    | 'soleil'
    | 'lune'
    | 'ecran'
    | 'info'
    | 'alerte'
    | 'coche'
}>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="size-5 shrink-0"
  >
    <template v-if="nom === 'maison'">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v10h13V10" />
    </template>
    <template v-else-if="nom === 'crayon'">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m13.5 6.5 3 3" />
    </template>
    <template v-else-if="nom === 'balance'">
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="m5 7-3 7a3 3 0 0 0 6 0L5 7Z" />
      <path d="m19 7-3 7a3 3 0 0 0 6 0l-3-7Z" />
    </template>
    <template v-else-if="nom === 'livre'">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </template>
    <template v-else-if="nom === 'plus'"><path d="M12 5v14M5 12h14" /></template>
    <template v-else-if="nom === 'croix'"><path d="m6 6 12 12M18 6 6 18" /></template>
    <template v-else-if="nom === 'soleil'">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </template>
    <template v-else-if="nom === 'lune'">
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </template>
    <template v-else-if="nom === 'ecran'">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </template>
    <template v-else-if="nom === 'info'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </template>
    <template v-else-if="nom === 'alerte'">
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </template>
    <template v-else-if="nom === 'coche'"><path d="m5 12.5 4.5 4.5L19 7.5" /></template>
  </svg>
</template>
