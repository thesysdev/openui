#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadValidator } from './api.mjs';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  process.stdout.write('Usage: node cli.mjs [--contract <export-directory>] <source.openui | ->\nExit: 0 valid (warnings preserved), 1 invalid program, 2 invocation/integrity/runtime failure.\n');
  process.exit(0);
}
try {
  let contractDirectory;
  let sourcePath;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--contract') contractDirectory = args[++i];
    else if (sourcePath == null && (args[i] === '-' || !args[i].startsWith('-'))) sourcePath = args[i];
    else throw new Error(`Unknown or repeated argument: ${args[i]}`);
  }
  const embedded = join(dirname(fileURLToPath(import.meta.url)), 'contracts');
  if (contractDirectory == null && existsSync(join(embedded, 'manifest.json'))) contractDirectory = embedded;
  if (sourcePath == null) throw new Error('A source file or - for stdin is required');
  const bytes = readFileSync(sourcePath === '-' ? 0 : sourcePath);
  const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const report = loadValidator({ contractDirectory }).validate(source);
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.valid ? 0 : 1;
} catch (error) {
  process.stdout.write(JSON.stringify({ valid: false, failure: { code: error.code ?? 'invocation-failed', message: error.message } }, null, 2) + '\n');
  process.exitCode = 2;
}
