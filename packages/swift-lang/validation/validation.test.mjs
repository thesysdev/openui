import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createValidator, loadValidator, sha256 } from './api.mjs';

const catalog = JSON.parse(readFileSync(new URL('../../swift-ui/Sources/OpenUISwiftUI/Resources/upstream-catalog.json', import.meta.url), 'utf8'));
const snapshot = () => JSON.parse(JSON.stringify(catalog.spec));
const make = () => { const library = snapshot(); return createValidator({ library, schema: library.schema }); };
const good = 'root=Stack([Card([TextContent("A supplied fact")])])';

test('default Card passes, while positional misuse retains raw errors despite a root', () => {
  const validator = make();
  assert.equal(validator.validate(good).valid, true);
  const result = validator.validate('root=Stack([Card([TextContent("fact")],"column","m")])');
  assert.equal(result.valid, false);
  assert.equal(result.root.typeName, 'Stack');
  assert.equal(result.errorCount, 2);
  assert.deepEqual(result.meta.errors.map(e => [e.component, e.path, e.severity]), [
    ['Card', '/variant', undefined], ['Card', '/direction', undefined],
  ]);
  assert.ok(result.signatures.Card.startsWith('Card('));
});

test('warnings remain warnings, not silent success or fabricated errors', () => {
  const result = make().validate('other=Stack([TextContent("fact")])');
  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 1);
  assert.equal(result.meta.errors[0].severity, 'warning');
  assert.equal(result.meta.errors[0].code, 'no-root');
  assert.equal(result.valid, true);
});

test('truncation, unresolved names and invalid roots do not pass', () => {
  const validator = make();
  assert.equal(validator.validate('root=Stack([TextContent("unfinished').valid, false);
  assert.deepEqual(validator.validate('root=Stack([missing])').meta.unresolved, ['missing']);
  assert.equal(validator.validate('root=Stack([missing])').valid, false);
  assert.equal(validator.validate('root=Stack("wrong")').valid, false);
});

test('schema property order is checked rather than normalized away', () => {
  const library = snapshot();
  const schema = JSON.parse(JSON.stringify(library.schema));
  const properties = schema.$defs.Card.properties;
  schema.$defs.Card.properties = Object.fromEntries(Object.entries(properties).reverse());
  assert.throws(() => createValidator({ schema, library }), { code: 'contract-schema-mismatch' });
});

function contract(directory) {
  const library = snapshot();
  library.id = 'sdk-validation-test'; library.version = 'test';
  const data = { 'library.json': JSON.stringify(library), 'schema.json': JSON.stringify(library.schema), 'prompt.txt': 'A fixed test export' };
  for (const [name, bytes] of Object.entries(data)) writeFileSync(join(directory, name), bytes);
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify({ id: library.id, version: library.version, sdkCommit: 'test', sha256: Object.fromEntries(Object.entries(data).map(([name, value]) => [name, sha256(value)])) }));
}

test('contract hash tampering is an integrity failure', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sdk-validation-'));
  try {
    contract(directory);
    assert.equal(loadValidator({ contractDirectory: directory }).validate(good).valid, true);
    writeFileSync(join(directory, 'schema.json'), '{}');
    assert.throws(() => loadValidator({ contractDirectory: directory }), { code: 'contract-hash-mismatch' });
  } finally { rmSync(directory, { recursive: true }); }
});

test('CLI stdin and exit codes distinguish invalid input from a broken release', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sdk-validation-'));
  try {
    contract(directory);
    const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
    const run = source => spawnSync(process.execPath, [cli, '--contract', directory, '-'], { input: source, encoding: 'utf8' });
    assert.equal(run(good).status, 0);
    const bad = run('root=Stack([Card([],"column","m")])');
    assert.equal(bad.status, 1); assert.equal(JSON.parse(bad.stdout).errorCount, 2);
    writeFileSync(join(directory, 'prompt.txt'), 'changed');
    const broken = run(good);
    assert.equal(broken.status, 2); assert.equal(JSON.parse(broken.stdout).failure.code, 'contract-hash-mismatch');
  } finally { rmSync(directory, { recursive: true }); }
});
