<script setup lang="ts">
const route = useRoute();

const SDKS = ['csharp', 'fsharp', 'go', 'java', 'kotlin', 'php', 'python', 'ruby', 'rust', 'swift', 'typescript'];
const LANGS = [...SDKS, 'spec'];

const currentLang = computed(() => {
  const seg = route.path.split('/').filter(Boolean)[0];
  return LANGS.includes(seg ?? '') ? seg : 'spec';
});

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'));

const langNav = computed(() => {
  const tree = navigation.value ?? [];
  const root = tree.find((n) => n.path === `/${currentLang.value}`);
  return root?.children ?? [];
});
</script>

<template>
  <div class="flex min-h-screen bg-(--ui-bg) text-(--ui-text)">
    <aside class="w-72 shrink-0 border-r border-(--ui-border) overflow-y-auto">
      <div class="px-6 py-5 border-b border-(--ui-border)">
        <NuxtLink to="/" class="text-lg font-semibold tracking-tight">ARCP</NuxtLink>
      </div>

      <div class="px-6 py-4 border-b border-(--ui-border)">
        <label class="block text-xs uppercase tracking-wider text-(--ui-text-muted) mb-2">Language</label>
        <select
          :value="currentLang"
          class="w-full bg-transparent border border-(--ui-border) rounded px-2 py-1.5 text-sm focus:outline-none focus:border-(--ui-primary)"
          @change="(e) => navigateTo('/' + (e.target as HTMLSelectElement).value)"
        >
          <option v-for="lang in LANGS" :key="lang" :value="lang">{{ lang }}</option>
        </select>
      </div>

      <nav class="px-3 py-4">
        <ul class="space-y-1">
          <li v-for="item in langNav" :key="item.path">
            <NuxtLink
              :to="item.path"
              class="block px-3 py-1.5 text-sm rounded hover:bg-(--ui-bg-elevated)"
              active-class="bg-(--ui-bg-elevated) text-(--ui-primary) font-medium"
            >
              {{ item.title }}
            </NuxtLink>
            <ul v-if="item.children?.length" class="ml-3 mt-1 space-y-0.5 border-l border-(--ui-border) pl-3">
              <li v-for="child in item.children" :key="child.path">
                <NuxtLink
                  :to="child.path"
                  class="block px-3 py-1 text-sm text-(--ui-text-muted) rounded hover:bg-(--ui-bg-elevated) hover:text-(--ui-text)"
                  active-class="text-(--ui-primary) font-medium"
                >
                  {{ child.title }}
                </NuxtLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="flex-1 min-w-0 px-8 py-10 max-w-4xl">
      <slot />
    </main>
  </div>
</template>
