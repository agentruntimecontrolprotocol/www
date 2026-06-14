<script setup lang="ts">
definePageMeta({ layout: 'docs' });

const route = useRoute();

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('docs').path(route.path).first(),
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

// Use the page's own title/description so browser tabs read the real heading
// (e.g. "ARCP: Agent Runtime Control Protocol") instead of a slug-derived
// fallback like "Draft Arcp 1 1".
useSeoMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
});

// #22 — on-page table of contents (right rail on wide screens).
const toc = computed(() => page.value?.body?.toc?.links ?? []);
</script>

<template>
  <div v-if="page" class="xl:flex xl:gap-12">
    <article class="prose prose-neutral dark:prose-invert min-w-0 max-w-3xl xl:flex-1">
      <ContentRenderer :value="page" />
    </article>
    <DocsToc v-if="toc.length" :links="toc" class="hidden w-52 shrink-0 xl:block" />
  </div>
</template>
