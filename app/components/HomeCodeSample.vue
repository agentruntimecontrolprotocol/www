<script setup lang="ts">
const props = defineProps<{
  code: {
    title: string;
    lang: string;
    caption?: string;
    source: string;
  };
}>();

const fenced = computed(() => `\`\`\`${props.code.lang}\n${props.code.source.trimEnd()}\n\`\`\``);
</script>

<template>
  <figure class="reveal mt-[2.4rem] md:ml-28 max-w-[40rem] m-0">
    <div class="code-window">
      <div class="code-window__bar">
        <span>{{ code.title }}</span>
        <span class="code-window__dots"><i /><i /><i /></span>
      </div>
      <MDC :value="fenced" tag="div" class="arcp-code" />
    </div>
    <figcaption
      v-if="code.caption"
      class="mt-[0.9rem] max-w-[40rem] text-[0.92rem] text-muted italic"
    >
      {{ code.caption }}
    </figcaption>
  </figure>
</template>
