<script setup lang="ts">
defineProps<{
  items: Array<{ index?: string; description?: string }>;
}>();
</script>

<template>
  <div class="reveal md:ml-28 max-w-[42rem] divide-y divide-line-soft">
    <div
      v-for="item in items"
      :key="item.index"
      class="grid grid-cols-[2.4rem_1fr] gap-[1.1rem] py-[1.05rem] items-start"
    >
      <div class="font-mono text-small text-faint pt-[0.18rem]">{{ item.index }}</div>
      <MDC :value="item.description ?? ''" tag="div" unwrap="p" class="text-[1rem] text-ink-soft leading-[1.5] arcp-step" />
    </div>
  </div>
</template>

<style>
.arcp-step code {
  font-family: var(--font-mono);
  font-size: 0.86em;
  color: var(--ink);
  background: var(--code-bg);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.04em 0.32em;
}
</style>
