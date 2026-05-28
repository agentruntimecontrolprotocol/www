<script setup lang="ts">
defineProps<{
  name: string;
  tags: string[];
}>();
</script>

<template>
  <header class="border-b border-line">
    <div class="max-w-[64rem] mx-auto px-[1.4rem] md:px-8 py-[1.15rem] flex items-baseline justify-between gap-4 flex-wrap">
      <NuxtLink
        to="/"
        class="font-mono font-semibold text-[1.02rem] tracking-[0.04em] text-ink no-underline inline-flex items-center"
      >
        {{ name }}<span class="arcp-caret" />
      </NuxtLink>
      <div class="font-mono text-mini tracking-mono text-muted flex gap-3 flex-wrap">
        <template v-for="(tag, i) in tags" :key="tag">
          <span class="whitespace-nowrap">{{ tag }}</span>
          <span v-if="i < tags.length - 1" class="text-line">/</span>
        </template>
      </div>
    </div>
  </header>
</template>
