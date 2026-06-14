import { queryCollection } from '@nuxt/content/server';

// Feeds every docs collection route into @nuxtjs/sitemap. Without this the
// sitemap only contains the statically-discovered homepage.
export default defineSitemapEventHandler(async (event) => {
  const docs = await queryCollection(event, 'docs').all();
  return docs
    .filter((doc) => Boolean(doc.path))
    .map((doc) => ({ loc: doc.path }));
});
