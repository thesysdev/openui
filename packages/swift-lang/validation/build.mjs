#!/usr/bin/env node
import { mkdirSync, readdirSync, copyFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadValidator, sha256 } from './api.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repository = resolve(here, '../../..');
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--output', '--contract'].includes(args[i]) || !args[i + 1]) throw new Error('Usage: node build.mjs --output <new-directory> [--contract <export-directory>]');
  options[args[i]] = args[i + 1];
}
if (!options['--output']) throw new Error('--output is required');
const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--',
  'packages/swift-lang/validation', 'packages/swift-lang/Sources/OpenUILang/Resources'],
  { cwd: repository, encoding: 'utf8' });
if (dirty.trim()) throw new Error('Commit the SDK validator and core resources before packaging');
const sdkCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
const output = resolve(options['--output']);
if (existsSync(output + '.tgz')) throw new Error('Preserve the existing archive; choose a new output directory');
mkdirSync(output, { recursive: false });
mkdirSync(join(output, 'runtime'));
for (const name of ['api.mjs', 'api.d.mts', 'cli.mjs', 'README.md']) copyFileSync(join(here, name), join(output, name));
const resources = resolve(here, '../Sources/OpenUILang/Resources');
for (const name of ['lang-core.js', 'core-manifest.json', 'THIRD-PARTY-NOTICES.txt']) copyFileSync(join(resources, name), join(output, 'runtime', name));
let contract = null;
if (options['--contract']) {
  const directory = resolve(options['--contract']);
  loadValidator({ contractDirectory: directory });
  mkdirSync(join(output, 'contracts'));
  for (const name of ['library.json', 'schema.json', 'prompt.txt', 'manifest.json']) copyFileSync(join(directory, name), join(output, 'contracts', name));
  contract = JSON.parse(readFileSync(join(output, 'contracts/manifest.json'), 'utf8'));
}
const files = {};
function collect(directory, prefix = '') {
  for (const item of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const relative = prefix + item.name;
    if (item.isDirectory()) collect(join(directory, item.name), relative + '/');
    else files[relative] = sha256(readFileSync(join(directory, item.name)));
  }
}
collect(output);
const core = JSON.parse(readFileSync(join(output, 'runtime/core-manifest.json'), 'utf8'));
if (sha256(readFileSync(join(output, 'runtime/lang-core.js'))) !== core.sha256) {
  throw new Error('Core bytes differ from the SDK core manifest');
}
const manifest = { format: 1, sdkCommit, entry: 'cli.mjs', api: 'api.mjs', node: '>=18',
  core: { upstream: core.upstream, sourceTree: core.sourceTree, sha256: core.sha256 }, contract, files };
writeFileSync(join(output, 'validator-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const archive = output + '.tgz';
execFileSync('tar', ['-czf', archive, '-C', dirname(output), basename(output)]);
const archiveSHA256 = sha256(readFileSync(archive));
writeFileSync(archive + '.sha256', archiveSHA256 + '  ' + basename(archive) + '\n');
process.stdout.write(JSON.stringify({ output, archive, sha256: archiveSHA256, sdkCommit, coreSHA256: core.sha256,
  manifestSHA256: sha256(readFileSync(join(output, 'validator-manifest.json'))) }, null, 2) + '\n');
