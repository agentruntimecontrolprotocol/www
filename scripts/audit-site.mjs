#!/usr/bin/env node
/**
 * Pre-launch site audit: HTTP status, console errors, layout overflow at breakpoints.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const ROUTES_FILE = process.env.ROUTES_FILE || '/tmp/www-routes.txt';
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../.audit');
const BREAKPOINTS = [375, 768, 1280, 1920];

mkdirSync(OUT_DIR, { recursive: true });

const routes = readFileSync(ROUTES_FILE, 'utf8').trim().split('\n').filter(Boolean);
console.log(`Routes: ${routes.length}`);

// --- Phase A: HTTP status crawl ---
const httpFailures = [];
const batchSize = 20;
for (let i = 0; i < routes.length; i += batchSize) {
  const batch = routes.slice(i, i + batchSize);
  await Promise.all(
    batch.map(async (route) => {
      try {
        const res = await fetch(`${BASE}${route}`, { redirect: 'follow' });
        if (!res.ok) {
          httpFailures.push({ route, status: res.status });
        }
      } catch (e) {
        httpFailures.push({ route, status: 0, error: String(e) });
      }
    }),
  );
  if ((i + batchSize) % 200 === 0 || i + batchSize >= routes.length) {
    process.stderr.write(`HTTP crawl: ${Math.min(i + batchSize, routes.length)}/${routes.length}\r`);
  }
}
console.log(`\nHTTP failures: ${httpFailures.length}`);

// --- Phase B: Browser audit (console + overflow) ---
// Sample: all non-api top-level pages + stratified api sample + any http failures
const topLevel = routes.filter((r) => {
  const parts = r.split('/').filter(Boolean);
  return parts.length <= 2 && !r.includes('/api/');
});
const apiSample = routes.filter((r) => r.includes('/api/')).filter((_, i) => i % 50 === 0);
const failureRoutes = httpFailures.map((f) => f.route);
const browserRoutes = [...new Set([...topLevel, ...apiSample, ...failureRoutes, '/'])];

const browser = await chromium.launch({ headless: true });
const findings = [];
const consoleByRoute = {};

for (const route of browserRoutes) {
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      logs.push({ type, text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    logs.push({ type: 'pageerror', text: err.message });
  });

  try {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
    const status = res?.status() ?? 0;
    if (status >= 400) {
      findings.push({
        route,
        breakpoint: 'all',
        category: 'rendering',
        severity: 'P0',
        description: `HTTP ${status} on page load`,
        evidence: `status=${status}`,
      });
    }

    // broken images
    const brokenImages = await page.evaluate(() =>
      [...document.querySelectorAll('img')].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src),
    );
    if (brokenImages.length) {
      findings.push({
        route,
        breakpoint: 'all',
        category: 'rendering',
        severity: 'P1',
        description: `${brokenImages.length} broken image(s)`,
        evidence: brokenImages.slice(0, 3).join(', '),
      });
    }

    if (logs.length) {
      consoleByRoute[route] = logs;
      const hasError = logs.some((l) => l.type === 'error' || l.type === 'pageerror');
      if (hasError) {
        findings.push({
          route,
          breakpoint: 'all',
          category: 'rendering',
          severity: 'P0',
          description: 'Console errors on page load',
          evidence: logs.map((l) => `[${l.type}] ${l.text}`).join('; '),
        });
      }
    }

    // Check overflow at each breakpoint
    for (const width of BREAKPOINTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const hasHScroll = doc.scrollWidth > doc.clientWidth + 2;
        const hasOverlap = [...document.querySelectorAll('*')].some((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;
          return r.right > window.innerWidth + 2;
        });
        return { hasHScroll, scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, hasOverlap };
      });
      if (overflow.hasHScroll || overflow.hasOverlap) {
        findings.push({
          route,
          breakpoint: width,
          category: 'responsive',
          severity: width <= 768 ? 'P1' : 'P2',
          description: `Horizontal overflow (scrollWidth=${overflow.scrollWidth}, viewport=${width})`,
          evidence: `hasHScroll=${overflow.hasHScroll}, hasOverlap=${overflow.hasOverlap}`,
        });
      }
    }
  } catch (e) {
    findings.push({
      route,
      breakpoint: 'all',
      category: 'rendering',
      severity: 'P0',
      description: 'Page failed to load in browser',
      evidence: String(e),
    });
  }
  await page.close();
  process.stderr.write(`Browser: ${browserRoutes.indexOf(route) + 1}/${browserRoutes.length}\r`);
}

await browser.close();
console.log(`\nBrowser routes checked: ${browserRoutes.length}`);
console.log(`Raw findings: ${findings.length}`);

const report = {
  base: BASE,
  routeCount: routes.length,
  httpFailures,
  browserRoutesChecked: browserRoutes.length,
  consoleByRoute,
  findings,
  routes,
};

writeFileSync(join(OUT_DIR, 'audit-report.json'), JSON.stringify(report, null, 2));
writeFileSync(join(OUT_DIR, 'routes.txt'), routes.join('\n'));
console.log(`Report written to ${OUT_DIR}/audit-report.json`);
