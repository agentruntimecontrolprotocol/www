#!/usr/bin/env node
// Sync the `docs/` directory from each SDK repo into this site so the build
// has a single tree of language-specific documentation to render.
//
// Resolution order, per SDK:
//   1. SDK_DOCS_LOCAL=1 forces local mode (skip git, fail if no sibling).
//   2. SDK_DOCS_REMOTE=1 forces remote mode (always clone).
//   3. Default: prefer a sibling `../<lang>-sdk/docs` when present, otherwise
//      shallow-clone the repo into a cache and copy `docs/` from there.
//
// Output goes to `<repo>/content/sdk/<lang>/` (gitignored). The script is
// idempotent: it wipes that directory and rewrites it on every run.

import { existsSync } from 'node:fs';
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const WORKSPACE = resolve(ROOT, '..');

const ORG = 'agentruntimecontrolprotocol';
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

const OUT_DIR = resolve(ROOT, 'content/sdk');
const CACHE_DIR = resolve(ROOT, '.cache/sdk-docs');

const FORCE_LOCAL = process.env.SDK_DOCS_LOCAL === '1';
const FORCE_REMOTE = process.env.SDK_DOCS_REMOTE === '1';

if (FORCE_LOCAL && FORCE_REMOTE) {
  console.error('sync-docs: SDK_DOCS_LOCAL and SDK_DOCS_REMOTE are mutually exclusive');
  process.exit(1);
}

async function git(args, opts = {}) {
  return exec('git', args, { ...opts, maxBuffer: 1024 * 1024 * 64 });
}

async function syncSdk(lang) {
  const repoName = `${lang}-sdk`;
  const localDocs = resolve(WORKSPACE, repoName, 'docs');
  const target = resolve(OUT_DIR, lang);

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });

  if (!FORCE_REMOTE && existsSync(localDocs)) {
    await cp(localDocs, target, { recursive: true });
    return { lang, source: 'local', path: localDocs };
  }

  if (FORCE_LOCAL) {
    throw new Error(`SDK_DOCS_LOCAL=1 but ${localDocs} does not exist`);
  }

  const cachePath = resolve(CACHE_DIR, repoName);
  if (existsSync(cachePath)) {
    await git(['fetch', '--depth', '1', 'origin', 'HEAD'], { cwd: cachePath });
    await git(['reset', '--hard', 'FETCH_HEAD'], { cwd: cachePath });
  } else {
    await mkdir(CACHE_DIR, { recursive: true });
    await git([
      'clone',
      '--depth',
      '1',
      '--filter=blob:none',
      '--sparse',
      `https://github.com/${ORG}/${repoName}.git`,
      cachePath,
    ]);
    await git(['sparse-checkout', 'set', 'docs'], { cwd: cachePath });
  }

  const cachedDocs = resolve(cachePath, 'docs');
  if (!existsSync(cachedDocs)) {
    throw new Error(`No docs/ directory found in ${ORG}/${repoName}`);
  }
  await cp(cachedDocs, target, { recursive: true });
  return { lang, source: 'remote', path: cachedDocs };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const results = await Promise.all(SDKS.map(syncSdk));
  for (const r of results) {
    console.log(`sync-docs: ${r.lang.padEnd(10)} <- ${r.source.padEnd(6)} ${r.path}`);
  }
}

main().catch((err) => {
  console.error('sync-docs failed:', err.message);
  process.exit(1);
});
