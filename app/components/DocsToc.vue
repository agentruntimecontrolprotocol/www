<script setup lang="ts">
type Link = { id: string; text: string; depth?: number; children?: Link[] };
defineProps<{ links: Link[] }>();
</script>

<template>
  <nav aria-label="On this page" class="sticky top-[4.75rem] max-h-[calc(100vh-7rem)] self-start overflow-y-auto">
    <p class="mb-3 font-mono text-mini uppercase tracking-wider text-muted">On this page</p>
    <ul class="space-y-1 border-l border-line text-sm">
      <li v-for="l in links" :key="l.id">
        <a
          :href="`#${l.id}`"
          class="-ml-px block border-l border-transparent py-0.5 pl-3 text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          {{ l.text }}
        </a>
        <ul v-if="l.children?.length" class="space-y-1">
          <li v-for="c in l.children" :key="c.id">
            <a
              :href="`#${c.id}`"
              class="-ml-px block border-l border-transparent py-0.5 pl-6 text-muted transition-colors hover:border-accent hover:text-accent"
            >
              {{ c.text }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>
