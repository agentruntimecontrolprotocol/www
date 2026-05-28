<script setup lang="ts">
defineProps<{
  columns: Array<{
    heading: string;
    tone: 'positive' | 'neutral';
    items: Array<{ label: string; note?: string }>;
  }>;
}>();
</script>

<template>
  <div class="reveal md:ml-28 max-w-[46rem] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
    <div v-for="col in columns" :key="col.heading">
      <h3
        class="font-mono text-[0.74rem] tracking-mono-wide uppercase font-medium mb-[1.1rem] pb-[0.7rem] border-b border-line"
        :class="col.tone === 'positive' ? 'text-ink' : 'text-muted'"
      >
        {{ col.heading }}
      </h3>
      <ul class="list-none m-0 p-0">
        <li
          v-for="item in col.items"
          :key="item.label"
          class="text-[0.97rem] leading-[1.45] py-2 pl-[1.3rem] relative"
          :class="col.tone === 'positive' ? 'text-ink-soft' : 'text-muted'"
        >
          <span
            class="absolute left-0 font-mono text-[0.85rem]"
            :class="col.tone === 'positive' ? 'text-accent' : 'text-faint'"
          >
            {{ col.tone === 'positive' ? '+' : '−' }}
          </span>
          {{ item.label }}
          <em v-if="item.note" class="not-italic font-mono text-[0.85em] text-accent-dim">
            {{ item.note }}
          </em>
        </li>
      </ul>
    </div>
  </div>
</template>
