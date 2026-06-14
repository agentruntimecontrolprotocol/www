#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const ROUTES_FILE = process.env.ROUTES_FILE || '/tmp/www-routes.txt';
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../.audit');
mkdirSync(OUT_DIR, { recursive: true });

const routes = readFileSync(ROUTES_FILE, 'utf8').trim().split('\n').filter(Boolean);
console.log(`Routes: ${routes.length}`);

const httpFailures = [];
const batchSize = 30;
for (let i = 0; i < routes.length; i += batchSize) {
  const batch = routes.slice(i, i + batchSize);
  await Promise.all(
    batch.map(async (route) => {
      try {
        const res = await fetch(`${BASE}${route}`, { redirect: 'follow' });
        if (!res.ok) httpFailures.push({ route, status: res.status });
      } catch (e) {
        httpFailures.push({ route, status: 0, error: String(e) });
      }
    }),
  );
  process.stderr.write(`HTTP: ${Math.min(i + batchSize, routes.length)}/${routes.length}\r`);
}
console.log(`\nHTTP failures: ${httpFailures.length}`);
if (httpFailures.length) console.log(httpFailures.slice(0, 20));

writeFileSync(join(OUT_DIR, 'http-failures.json'), JSON.stringify(httpFailures, null, 2));
writeFileSync(join(OUT_DIR, 'routes.txt'), routes.join('\n'));
