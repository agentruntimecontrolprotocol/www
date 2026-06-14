<script setup lang="ts">
const { data: home } = await useHomeContent();

if (!home.value) {
  throw createError({ statusCode: 404, statusMessage: 'Home content missing', fatal: true });
}

useSeoMeta({
  title: home.value.seo.title,
  description: home.value.seo.description,
  ogTitle: home.value.seo.title,
  ogDescription: home.value.seo.description,
});

onMounted(() => {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
});
</script>

<template>
  <div v-if="home" class="home-prose relative z-[1]">
    <AppHeader :tags="home.header.tags" />

    <main>
    <!-- hero -->
    <div class="border-b border-line">
      <div class="max-w-[64rem] mx-auto px-[1.4rem] md:px-8 pt-16 pb-14 md:pt-[6.5rem] md:pb-[4.5rem]">
        <div class="reveal-load animate-rise [animation-delay:0.05s] eyebrow mb-[1.6rem]">
          {{ home.hero.eyebrow }}
        </div>
        <h1 class="reveal-load animate-rise [animation-delay:0.16s] font-serif font-medium leading-[1.04] tracking-display max-w-[18ch] mb-[1.7rem] text-[clamp(2.4rem,5.8vw,4.1rem)]">
          {{ home.hero.headline }}
        </h1>
        <MDC
          :value="home.hero.lede"
          tag="p"
          unwrap="p"
          class="reveal-load animate-rise [animation-delay:0.27s] text-[clamp(1.15rem,2.2vw,1.42rem)] leading-[1.5] text-ink-soft max-w-[36rem] font-normal"
        />
      </div>
    </div>

    <!-- numbered sections -->
    <section
      v-for="section in home.sections"
      :id="section.id"
      :key="section.id"
      class="border-b border-line"
    >
      <div class="max-w-[64rem] mx-auto px-[1.4rem] md:px-8 py-[4.5rem]">
        <div class="reveal grid grid-cols-1 md:grid-cols-[5.5rem_1fr] gap-[0.6rem] md:gap-6 items-start mb-[1.8rem] md:mb-[2.4rem]">
          <div class="section-marker">{{ section.number }}</div>
          <h2 class="section-title m-0">{{ section.kicker }}</h2>
        </div>

        <div v-if="section.body" class="reveal spec-prose md:ml-28">
          <MDC :value="section.body" tag="div" />
        </div>

        <HomeDiagram v-if="section.diagram" :diagram="section.diagram" />
        <HomeConcernsGrid v-if="section.kind === 'grid' && section.items" :items="section.items" />
        <HomeSteps v-if="section.kind === 'list' && section.items" :items="section.items" />
        <HomeCodeSample v-if="section.kind === 'list' && section.code" :code="section.code" />
        <HomeScopeColumns v-if="section.kind === 'columns' && section.columns" :columns="section.columns" />
      </div>
    </section>

    </main>

    <!-- footer -->
    <footer>
      <div class="max-w-[64rem] mx-auto px-[1.4rem] md:px-8 flex flex-col md:flex-row md:flex-wrap gap-8 items-start md:items-end justify-between py-14 md:pb-[4.5rem]">
        <NuxtLink :to="home.cta.to" class="btn-arrow">
          {{ home.cta.label }} <span class="text-accent">→</span>
        </NuxtLink>
        <div class="font-mono text-mini leading-[1.9] text-muted text-left md:text-right">
          <p>{{ home.footer.line1 }}</p>
          <p>{{ home.footer.line2 }}</p>
          <p>
            <a :href="home.footer.contact.href" class="text-ink-soft no-underline border-b border-line hover:text-accent hover:border-accent">
              {{ home.footer.contact.label }}
            </a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
