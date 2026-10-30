import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const bundled = join(here, 'runtime');
const defaultRuntime = existsSync(join(bundled, 'core-manifest.json'))
  ? bundled : resolve(here, '../Sources/OpenUILang/Resources');
export const sha256 = data => createHash('sha256').update(data).digest('hex');

/** Loading/integrity/runtime failures are distinct from invalid model input. */
export class ValidatorError extends Error {
  constructor(code, message) { super(message); this.name = 'ValidatorError'; this.code = code; }
}

function fail(code, message) { throw new ValidatorError(code, message); }

/** Load exactly one exported release. JSON property order is positional order. */
export function loadValidator({ contractDirectory, ...options } = {}) {
  if (!contractDirectory) fail('contract-required', 'A contract directory is required');
  const directory = resolve(contractDirectory);
  const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8'));
  const files = {};
  for (const name of ['library.json', 'schema.json', 'prompt.txt']) {
    files[name] = readFileSync(join(directory, name));
    if (!manifest.sha256?.[name] || sha256(files[name]) !== manifest.sha256[name]) {
      fail('contract-hash-mismatch', `Contract hash mismatch: ${name}`);
    }
  }
  const library = JSON.parse(files['library.json'].toString('utf8'));
  const schema = JSON.parse(files['schema.json'].toString('utf8'));
  if (manifest.id !== library.id || manifest.version !== library.version) {
    fail('contract-identity-mismatch', 'Manifest and library identity differ');
  }
  return createValidator({ ...options, schema, library, manifest });
}

/** Static DSL validation only: no renderers, tools, actions, fetch or model call. */
export function createValidator({ schema, library, manifest, runtimeDirectory = defaultRuntime, timeoutMs = 1000 } = {}) {
  if (!schema || !library?.schema || !library.components) {
    fail('contract-required', 'schema and the matching exported library are required');
  }
  // Equality deliberately includes object-key order; sorting changes call slots.
  if (JSON.stringify(schema) !== JSON.stringify(library.schema)) {
    fail('contract-schema-mismatch', 'Standalone and library schemas differ, including positional property order');
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) {
    fail('invalid-timeout', 'timeoutMs must be an integer from 1 through 30000');
  }
  const runtime = resolve(runtimeDirectory);
  const core = JSON.parse(readFileSync(join(runtime, 'core-manifest.json'), 'utf8'));
  const bytes = readFileSync(join(runtime, 'lang-core.js'));
  if (sha256(bytes) !== core.sha256) fail('core-hash-mismatch', 'Bundled core hash differs from its SDK manifest');
  const realm = vm.createContext({
    __utf8Encode: value => Array.from(Buffer.from(String(value), 'utf8')),
    __utf8Decode: value => Buffer.from(value).toString('utf8'),
  });
  new vm.Script(bytes.toString('utf8'), { filename: 'sdk-lang-core.js' })
    .runInContext(realm, { timeout: timeoutMs });
  realm.__schemaJSON = JSON.stringify(schema);
  realm.__rootName = library.root ?? schema.root;
  vm.runInContext('__parser = SwiftCore.api.createParser(JSON.parse(__schemaJSON), __rootName)', realm, { timeout: timeoutMs });
  const parse = new vm.Script('__result = __parser.parse(__source)', { filename: 'sdk-validate-program.js' });
  const contract = {
    id: library.id ?? null, version: library.version ?? null,
    sdkCommit: manifest?.sdkCommit ?? null,
    schemaSHA256: manifest?.sha256?.['schema.json'] ?? null,
    librarySHA256: manifest?.sha256?.['library.json'] ?? null,
  };
  const signatures = Object.fromEntries(Object.entries(library.components).map(([name, value]) => [name, value.signature]));
  return {
    validate(source) {
      if (typeof source !== 'string') fail('source-required', 'source must be a string');
      realm.__source = source;
      try { parse.runInContext(realm, { timeout: timeoutMs }); }
      catch (error) {
        fail(error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' ? 'validation-timeout' : 'core-execution-failed', String(error.message));
      } finally { realm.__source = undefined; }
      const result = realm.__result;
      const meta = JSON.parse(JSON.stringify(result.meta));
      const diagnostics = meta.errors ?? [];
      const errorCount = diagnostics.filter(error => error.severity !== 'warning').length;
      const warningCount = diagnostics.filter(error => error.severity === 'warning').length;
      const hasRootExpression = result.rootExpression != null;
      const hasRoot = result.root != null || hasRootExpression;
      const root = result.root == null ? null : {
        typeName: result.root.typeName, partial: result.root.partial,
        ...(result.root.statementId == null ? {} : { statementId: result.root.statementId }),
      };
      const report = {
        valid: hasRoot && !meta.incomplete && !meta.unresolved?.length && errorCount === 0,
        mode: 'static', sourceSHA256: sha256(Buffer.from(source, 'utf8')),
        contract, core: { upstream: core.upstream, sourceTree: core.sourceTree, sha256: core.sha256 },
        root, hasRootExpression, errorCount, warningCount, meta,
        signatures: Object.fromEntries([...new Set(diagnostics.map(error => error.component))]
          .filter(name => signatures[name] != null).map(name => [name, signatures[name]])),
      };
      realm.__result = undefined;
      return report;
    },
  };
}
