import { defineCollection, defineContentConfig, z } from '@nuxt/content';

const linkSchema = z.object({
  label: z.string(),
  to: z.string().optional(),
  href: z.string().optional(),
  icon: z.string().optional(),
  external: z.boolean().optional(),
});

export default defineContentConfig({
  collections: {
    home: defineCollection({
      type: 'page',
      source: 'home.md',
      schema: z.object({
        seo: z.object({
          title: z.string(),
          description: z.string(),
        }),
        header: z.object({
          name: z.string(),
          tags: z.array(z.string()),
        }),
        hero: z.object({
          eyebrow: z.string(),
          headline: z.string(),
          lede: z.string(),
        }),
        sections: z.array(
          z.object({
            id: z.string(),
            number: z.string(),
            kicker: z.string(),
            kind: z.enum(['prose', 'grid', 'list', 'columns', 'code']),
            body: z.string().optional(),
            items: z
              .array(
                z.object({
                  title: z.string().optional(),
                  description: z.string().optional(),
                  label: z.string().optional(),
                  index: z.string().optional(),
                }),
              )
              .optional(),
            columns: z
              .array(
                z.object({
                  heading: z.string(),
                  tone: z.enum(['positive', 'neutral']),
                  items: z.array(
                    z.object({
                      label: z.string(),
                      note: z.string().optional(),
                    }),
                  ),
                }),
              )
              .optional(),
            code: z
              .object({
                title: z.string(),
                lang: z.string(),
                caption: z.string().optional(),
                source: z.string(),
              })
              .optional(),
            diagram: z
              .object({
                outer: z.object({
                  label: z.string(),
                  tags: z.array(z.string()),
                }),
                inner: z.object({
                  label: z.string(),
                  tags: z.array(z.string()),
                }),
                aside: z.string(),
              })
              .optional(),
          }),
        ),
        cta: z.object({
          label: z.string(),
          to: z.string(),
        }),
        footer: z.object({
          line1: z.string(),
          line2: z.string(),
          contact: linkSchema,
        }),
      }),
    }),
    docs: defineCollection({
      type: 'page',
      source: {
        include: '**/*.md',
        exclude: ['home.md'],
      },
    }),
  },
});
