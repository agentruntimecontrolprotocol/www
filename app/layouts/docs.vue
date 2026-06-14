<script setup lang="ts">
const route = useRoute();

const SDKS = ['csharp', 'fsharp', 'go', 'java', 'kotlin', 'php', 'python', 'ruby', 'rust', 'swift', 'typescript'];
const LANGS = [...SDKS, 'spec'];

const currentLang = computed(() => {
  const seg = route.path.split('/').filter(Boolean)[0];
  return LANGS.includes(seg ?? '') ? seg : 'spec';
});

// #2 — two-way binding so the control reflects the active SDK on SSR and on
// client-side navigation; setting it routes to that language's docs root.
const selectedLang = computed({
  get: () => currentLang.value,
  set: (value: string) => {
    navigateTo('/' + value);
  },
});

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'));

// #9 — Nuxt Content emits a folder's index page both as the folder node and as
// its own first child, producing duplicate sidebar rows. Drop children that
// point back at their parent, and collapse same-path siblings.
type NavItem = { path: string; title?: string; children?: NavItem[] };
function dedupe(nodes: NavItem[] | undefined, parentPath?: string): NavItem[] {
  const seen = new Set<string>();
  const out: NavItem[] = [];
  for (const node of nodes ?? []) {
    if (parentPath && node.path === parentPath) continue; // self-referential index child
    if (seen.has(node.path)) {
      const existing = out.find((n) => n.path === node.path);
      if (existing && node.children?.length && !existing.children?.length) {
        existing.children = dedupe(node.children, node.path);
      }
      continue;
    }
    seen.add(node.path);
    out.push({ ...node, children: dedupe(node.children, node.path) });
  }
  return out;
}

const langNav = computed(() => {
  const tree = (navigation.value ?? []) as NavItem[];
  const root = tree.find((n) => n.path === `/${currentLang.value}`);
  return dedupe(root?.children, root?.path);
});

// #21 — collapsible groups. A group is open when it's on the active trail,
// unless the user has manually toggled it.
const manualToggles = reactive<Record<string, boolean>>({});
function isOpen(path: string) {
  if (path in manualToggles) return manualToggles[path];
  return route.path === path || route.path.startsWith(path + '/');
}
function toggle(path: string) {
  manualToggles[path] = !isOpen(path);
}

// #1 — mobile drawer state; close whenever the route changes.
const navOpen = ref(false);
watch(() => route.path, () => {
  navOpen.value = false;
});
</script>

<template>
  <div class="min-h-screen bg-(--ui-bg) text-(--ui-text)">
    <AppHeader show-menu @toggle-menu="navOpen = !navOpen" />

    <div class="lg:flex">
      <!-- backdrop (mobile, when open) -->
      <div
        v-if="navOpen"
        class="fixed inset-0 top-14 z-20 bg-black/40 lg:hidden"
        aria-hidden="true"
        @click="navOpen = false"
      />

      <aside
        id="docs-nav"
        class="fixed lg:sticky top-14 left-0 z-30 w-72 shrink-0 h-[calc(100dvh-3.5rem)] lg:h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-(--ui-border) bg-(--ui-bg) transition-transform duration-200 lg:translate-x-0"
        :class="navOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="px-6 py-4 border-b border-(--ui-border)">
          <label class="block text-xs uppercase tracking-wider text-(--ui-text-muted) mb-2">Language</label>
          <USelect
            v-model="selectedLang"
            :items="LANGS"
            size="sm"
            class="w-full"
          />
        </div>

        <nav class="px-3 py-4">
          <ul class="space-y-0.5">
            <li v-for="item in langNav" :key="item.path">
              <div class="flex items-center gap-0.5">
                <NuxtLink
                  :to="item.path"
                  class="flex-1 min-w-0 block px-3 py-1.5 text-sm rounded text-(--ui-text) hover:bg-(--ui-bg-elevated) truncate"
                  active-class="bg-(--ui-bg-elevated) text-(--ui-primary) font-medium"
                >
                  {{ item.title }}
                </NuxtLink>
                <button
                  v-if="item.children?.length"
                  type="button"
                  class="shrink-0 inline-flex size-7 items-center justify-center rounded text-(--ui-text-muted) hover:text-(--ui-text)"
                  :aria-expanded="isOpen(item.path)"
                  :aria-label="`Toggle ${item.title}`"
                  @click="toggle(item.path)"
                >
                  <svg class="transition-transform" :class="isOpen(item.path) ? 'rotate-90' : ''" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
              <ul v-if="item.children?.length && isOpen(item.path)" class="ml-3 mt-0.5 mb-1 space-y-0.5 border-l border-(--ui-border) pl-3">
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

      <main class="flex-1 min-w-0 px-5 py-8 sm:px-8 lg:py-10 max-w-4xl xl:max-w-6xl">
        <slot />
      </main>
    </div>
  </div>
</template>
