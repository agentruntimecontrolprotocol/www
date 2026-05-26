<script setup lang="ts">
definePageMeta({ layout: 'docs' });

const route = useRoute();

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('docs').path(route.path).first(),
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}
</script>

<template>
  <article v-if="page" class="prose prose-neutral dark:prose-invert max-w-none">
    <ContentRenderer :value="page" />
  </article>
</template>
