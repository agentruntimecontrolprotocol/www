// Nuxt Content serves docs at lowercase paths, but file-derived / shared URLs
// often carry the original PascalCase (e.g. /csharp/api/Arcp.AspNetCore). Those
// 404 today. Redirect any miscased doc URL to its lowercase canonical (301).
const ASSET_RE = /\.(svg|png|jpe?g|gif|webp|avif|ico|css|js|mjs|cjs|json|xml|txt|map|woff2?|ttf|eot|webmanifest|pdf)$/i;

export default defineEventHandler((event) => {
  const full = event.path; // includes query string
  const path = full.split('?')[0];

  if (!/[A-Z]/.test(path)) return; // already lowercase — nothing to do
  if (path.startsWith('/_') || path.startsWith('/__') || path.startsWith('/api')) return;
  if (ASSET_RE.test(path)) return; // static asset request

  const lower = path.toLowerCase();
  if (lower !== path) {
    const query = full.slice(path.length);
    return sendRedirect(event, lower + query, 301);
  }
});
