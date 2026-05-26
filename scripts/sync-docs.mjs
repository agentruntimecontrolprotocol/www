#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, '..');
const arpcRoot = resolve(wwwRoot, '..');

const SDKS = [
  'csharp',
  'fsharp',
  'go',
  'java',
  'kotlin',
  'php',
  'python',
  'ruby',
  'rust',
  'swift',
  'typescript',
];

const SOURCES = [
  ...SDKS.map((lang) => ({
    label: lang,
    docs: join(arpcRoot, `${lang}-sdk`, 'docs'),
    contentDest: join(wwwRoot, 'content', lang),
    publicDiagrams: `/diagrams/${lang}`,
    diagramsDest: join(wwwRoot, 'public', 'diagrams', lang),
  })),
  {
    label: 'spec',
    docs: join(arpcRoot, 'spec', 'docs'),
    contentDest: join(wwwRoot, 'content', 'spec'),
    publicDiagrams: '/diagrams/spec',
    diagramsDest: join(wwwRoot, 'public', 'diagrams', 'spec'),
  },
];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

function rewriteDiagramRefs(markdown, publicDiagramsBase) {
  // Match any relative URL whose path includes a `diagrams/` segment and rewrite
  // it to the absolute /diagrams/<lang>/<rest>. Covers markdown links/images
  // and inline HTML src/href.
  const replaceUrl = (url) => {
    if (/^(https?:)?\/\//.test(url)) return url;
    if (url.startsWith('/')) return url;
    const m = url.match(/(?:^|[./])diagrams\/(.+)$/);
    if (!m) return url;
    return `${publicDiagramsBase}/${m[1]}`;
  };

  // markdown image / link: ![alt](url) and [text](url)
  let out = markdown.replace(/(!?\[[^\]]*\])\(([^)\s]+)(\s+"[^"]*")?\)/g, (full, label, url, title) => {
    return `${label}(${replaceUrl(url)}${title ?? ''})`;
  });

  // html src / href
  out = out.replace(/\b(src|href)=("([^"]+)"|'([^']+)')/g, (full, attr, _all, dq, sq) => {
    const url = dq ?? sq;
    return `${attr}="${replaceUrl(url)}"`;
  });

  return out;
}

async function copyMarkdownTree(src, dest, publicDiagramsBase) {
  if (!(await exists(src))) return 0;
  let copied = 0;
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'diagrams') continue;
    const from = join(src, entry.name);
    if (entry.isDirectory()) {
      copied += await copyMarkdownTree(from, join(dest, entry.name), publicDiagramsBase);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!/\.(md|mdc)$/i.test(entry.name)) continue;
    const targetName = /^readme\.mdc?$/i.test(entry.name) ? entry.name.replace(/^readme/i, 'index') : entry.name;
    const to = join(dest, targetName);
    const raw = await readFile(from, 'utf8');
    const rewritten = rewriteDiagramRefs(raw, publicDiagramsBase);
    await mkdir(dirname(to), { recursive: true });
    await writeFile(to, rewritten);
    copied += 1;
  }
  return copied;
}

async function copyDiagramsTree(src, dest) {
  if (!(await exists(src))) return 0;
  let copied = 0;
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      copied += await copyDiagramsTree(from, to);
      continue;
    }
    if (!entry.isFile()) continue;
    await mkdir(dirname(to), { recursive: true });
    await cp(from, to);
    copied += 1;
  }
  return copied;
}

async function listMarkdown(dir, prefix = '') {
  if (!(await exists(dir))) return [];
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'diagrams') continue;
    if (entry.isDirectory()) {
      out.push(...(await listMarkdown(join(dir, entry.name), `${prefix}${entry.name}/`)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!/\.(md|mdc)$/i.test(entry.name)) continue;
    if (/^index\.mdc?$/i.test(entry.name)) continue;
    const base = entry.name.replace(/\.(md|mdc)$/i, '');
    out.push(`${prefix}${base}`);
  }
  return out.sort();
}

async function ensureIndex(label, contentDest) {
  const indexPath = join(contentDest, 'index.md');
  if (await exists(indexPath)) return;
  const slugs = await listMarkdown(contentDest);
  const lines = [
    `# ${label}`,
    '',
    ...slugs.map((s) => `- [${s}](/${label}/${s})`),
    '',
  ];
  await writeFile(indexPath, lines.join('\n'));
}

async function syncSource({ label, docs, contentDest, publicDiagrams, diagramsDest }) {
  if (!(await exists(docs))) {
    console.warn(`sync-docs: ${label.padEnd(10)}  skipped (missing ${relative(arpcRoot, docs)})`);
    return;
  }

  await rm(contentDest, { recursive: true, force: true });
  await rm(diagramsDest, { recursive: true, force: true });

  const mdCount = await copyMarkdownTree(docs, contentDest, publicDiagrams);
  const diagramCount = await copyDiagramsTree(join(docs, 'diagrams'), diagramsDest);
  await ensureIndex(label, contentDest);

  console.log(
    `sync-docs: ${label.padEnd(10)} <- ${relative(arpcRoot, docs)}  (${mdCount} docs, ${diagramCount} diagrams)`,
  );
}

async function main() {
  for (const source of SOURCES) {
    await syncSource(source);
  }
}

main().catch((err) => {
  console.error('sync-docs failed:', err);
  process.exit(1);
});
