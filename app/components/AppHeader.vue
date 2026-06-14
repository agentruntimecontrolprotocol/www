<script setup lang="ts">
defineProps<{
  /** spec-document tags shown on the home header (Internet-Draft / …) */
  tags?: string[];
  /** show the hamburger that toggles the docs sidebar drawer (mobile) */
  showMenu?: boolean;
}>();

const emit = defineEmits<{ toggleMenu: [] }>();

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');
function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark';
}

const NAV = [
  { label: 'Docs', to: '/python' },
  { label: 'Spec', to: '/spec/draft-arcp-1.1' },
];
const GITHUB = 'https://github.com/agentruntimecontrolprotocol';
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-[80rem] items-center justify-between gap-4 px-[1.4rem] md:px-8">
      <div class="flex min-w-0 items-center gap-3">
        <button
          v-if="showMenu"
          type="button"
          class="-ml-1 inline-flex size-9 items-center justify-center rounded text-muted hover:text-ink lg:hidden"
          aria-label="Toggle navigation"
          @click="emit('toggleMenu')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        <NuxtLink to="/" class="inline-flex items-center font-mono text-[1.02rem] font-semibold tracking-[0.04em] text-ink no-underline">
          ARCP<span class="arcp-caret" />
        </NuxtLink>
        <div v-if="tags?.length" class="ml-3 hidden items-center gap-2 font-mono text-mini text-muted md:flex">
          <template v-for="(t, i) in tags" :key="t">
            <span class="whitespace-nowrap">{{ t }}</span>
            <span v-if="i < tags.length - 1" class="text-line">/</span>
          </template>
        </div>
      </div>

      <nav class="flex items-center gap-1 font-mono text-mini sm:gap-2">
        <NuxtLink
          v-for="l in NAV"
          :key="l.to"
          :to="l.to"
          class="rounded px-2 py-1 text-ink-soft transition-colors hover:text-accent"
          active-class="text-accent"
        >
          {{ l.label }}
        </NuxtLink>
        <a :href="GITHUB" target="_blank" rel="noopener" class="rounded px-2 py-1 text-ink-soft transition-colors hover:text-accent">GitHub</a>
        <ClientOnly>
          <button
            type="button"
            class="ml-1 inline-flex size-8 items-center justify-center rounded text-muted hover:text-ink"
            :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="toggleTheme"
          >
            <svg v-if="isDark" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" /></svg>
            <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></svg>
          </button>
          <template #fallback>
            <span class="ml-1 size-8" />
          </template>
        </ClientOnly>
      </nav>
    </div>
  </header>
</template>
