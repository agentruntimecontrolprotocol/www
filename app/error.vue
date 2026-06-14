<script setup lang="ts">
const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string };
}>();

const code = computed(() => props.error?.statusCode ?? 500);
const is404 = computed(() => code.value === 404);
const headline = computed(() => (is404.value ? 'Page not found' : 'Something went wrong'));

useSeoMeta({
  title: () => `${code.value} — ${headline.value}`,
});

const handleHome = () => clearError({ redirect: '/' });
</script>

<template>
  <div class="min-h-screen flex flex-col bg-(--ui-bg) text-ink relative z-[1]">
    <header class="border-b border-line">
      <div class="max-w-[64rem] w-full mx-auto px-[1.4rem] md:px-8 py-[1.15rem]">
        <NuxtLink to="/" class="font-mono font-semibold text-[1.02rem] tracking-[0.04em] text-ink no-underline">
          ARCP
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1 flex items-center">
      <div class="max-w-[64rem] w-full mx-auto px-[1.4rem] md:px-8 py-24">
        <div class="eyebrow mb-[1.4rem]">Error {{ code }}</div>
        <h1 class="font-serif font-medium leading-[1.05] tracking-display mb-[1.4rem] text-[clamp(2.2rem,5vw,3.6rem)]">
          {{ headline }}
        </h1>
        <p class="text-ink-soft text-[1.1rem] leading-[1.5] max-w-[34rem] mb-[2.2rem]">
          <template v-if="is404">
            That page doesn’t exist. It may have moved, or the URL may be miscased —
            documentation paths are all lowercase.
          </template>
          <template v-else>
            An unexpected error occurred. Try again, or head back to the documentation.
          </template>
        </p>
        <div class="flex flex-wrap gap-x-8 gap-y-4 items-center">
          <button type="button" class="btn-arrow cursor-pointer bg-transparent" @click="handleHome">
            Back home <span class="text-accent">→</span>
          </button>
          <NuxtLink to="/spec/draft-arcp-1.1" class="btn-arrow">
            Read the specification <span class="text-accent">→</span>
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>
