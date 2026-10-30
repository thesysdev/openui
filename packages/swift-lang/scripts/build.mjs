import { build } from 'esbuild';
import { readiness } from './readiness-compat.mjs';
import {
  serializer,
  replaceOnce,
  materializer,
} from './compat.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const here = dirname(fileURLToPath(import.meta.url)),
  root = resolve(here, '../../..');
// The 1.0.2 checkout changes only release files and excluded telemetry relative
// to the previous pin; parser/runtime/authoring sources are byte-identical.
const pin = 'bf6be546007f96c87689c7b47c29e1f09175f6f6';
if (
  execFileSync('git', ['rev-parse', 'HEAD:packages/lang-core'], {
    cwd: root,
    encoding: 'utf8',
  }).trim() !== pin
)
  throw Error('Review upstream source pin');
execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'packages/lang-core'], {
  cwd: root,
});
const banner = `globalThis.TextEncoder=class{encode(s){return Uint8Array.from(__utf8Encode(String(s)))}};globalThis.TextDecoder=class{decode(bytes){return __utf8Decode(bytes)}};globalThis.console={warn(){},error(){},log(){}};`;
const result = await build({
  absWorkingDir: root,
  entryPoints: ['packages/swift-lang/scripts/entry.ts'],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'SwiftCore',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  target: ['safari15'],
  minify: true,
  legalComments: 'eof',
  nodePaths: [join(here, 'node_modules')],
  banner: { js: banner },
  metafile: true,
  plugins: [
    {
      name: 'native-compatibility',
      setup(b) {
        b.onLoad({ filter: /\/parser\/materialize\.ts$/ }, (args) => ({
          contents: readiness(materializer(readFileSync(args.path, 'utf8')), 'materialize', join(here, 'readiness.ts')),
          loader: 'ts',
        }));
        b.onLoad({ filter: /\/utils\/validation\.ts$/ }, (args) => ({
          contents: replaceOnce(
            readFileSync(args.path, 'utf8'),
            'return new RegExp(arg).test(value) ? undefined : \"Invalid format\";',
            'const outcome=__nativePattern(arg,value);return outcome===\"matches\"||outcome===\"invalidPattern\"?undefined:\"Invalid format\";',
          ),
          loader: 'ts',
        }));
        b.onLoad({ filter: /\/parser\/serialize\.ts$/ }, (args) => ({
          contents: serializer(readFileSync(args.path, 'utf8')),
          loader: 'ts',
        }));
        for (const [kind, filter] of [
          ['lexer', /\/parser\/lexer\.ts$/],
          ['expressions', /\/parser\/expressions\.ts$/],
          ['evaluator', /\/runtime\/evaluator\.ts$/],
          ['evaluate-tree', /\/runtime\/evaluate-tree\.ts$/],
        ]) b.onLoad({filter}, (args) => ({
          contents: readiness(readFileSync(args.path, 'utf8'), kind, join(here, 'readiness.ts')),
          loader: 'ts',
        }));

      },
    },
    {
      name: 'native-helper-exports',
      setup(b) {
        b.onLoad({ filter: /\/parser\/parser\.ts$/ }, (args) => ({
          contents:
            readiness(readFileSync(args.path, 'utf8'), 'parser', join(here, 'readiness.ts')) +
            '\nexport {preprocess as nativePreprocess};',
          loader: 'ts',
        }));
        b.onLoad({ filter: /\/parser\/merge\.ts$/ }, (args) => ({
          contents:
            readFileSync(args.path, 'utf8') +
            '\nexport {splitStatementSource as nativeSplitSource};',
          loader: 'ts',
        }));
      },
    },
    {
      name: 'no-native-telemetry',
      setup(b) {
        b.onLoad({ filter: /\/telemetry\/runtime\.ts$/ }, () => ({
          contents:
            'export const prepareParserParseTelemetry=()=>undefined;export const captureParserParseResult=()=>{};export const captureParserParseException=()=>{};export const recordSystemPromptGeneration=()=>{};',
          loader: 'ts',
        }));
      },
    },
  ],
});
const imports = Object.values(result.metafile.outputs).flatMap(
  (x) => x.imports,
);
if (imports.length) throw Error('Unexpected external runtime imports');
const out = join(here, '../Sources/OpenUILang/Resources');
mkdirSync(out, { recursive: true });
const data = Buffer.from(
  result.outputFiles[0].text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n'),
);
writeFileSync(join(out, 'lang-core.js'), data);
const licenses = [
  'Upstream OpenUI (MIT)',
  readFileSync(join(root, 'LICENSE'), 'utf8'),
  'Bounded native pattern backend',
  readFileSync(join(here, '../Sources/COpenUIRegExp/vendor/LICENSE'), 'utf8'),
];
for (const name of [
  'zod',
  'whatwg-url',
  'webidl-conversions',
  'tr46',
  'punycode',
]) {
  const d = join(here, 'node_modules', name);
  let text;
  for (const file of [
    'LICENSE',
    'LICENSE.md',
    'LICENSE.txt',
    'LICENSE-MIT.txt',
  ])
    try {
      text = readFileSync(join(d, file), 'utf8');
      break;
    } catch {}
  if (!text) throw Error('Missing license ' + name);
  licenses.push(name + '\n' + text);
}
writeFileSync(
  join(out, 'THIRD-PARTY-NOTICES.txt'),
  licenses
    .join('\n\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n'),
);
writeFileSync(
  join(out, 'core-manifest.json'),
  JSON.stringify(
    {
      upstream: 'f08a660535e55b5b2a24a0eb68568edaf9e4fe4b',
      sourceTree: pin,
      sha256: createHash('sha256').update(data).digest('hex'),
      bytes: data.length,
      lockSha256: createHash('sha256')
        .update(readFileSync(join(here, 'package-lock.json')))
        .digest('hex'),
      adapterSha256: createHash('sha256')
        .update(
          ['entry.ts', 'captures.ts', 'authoring.ts', 'compat.mjs', 'readiness.ts', 'readiness-compat.mjs', 'build.mjs']
            .map((name) => readFileSync(join(here, name), 'utf8'))
            .join('\n'),
        )
        .digest('hex'),
      telemetry:
        'excluded at build time: native host has no process, fetch or install telemetry',
      bridge: 'opaque captures resolve through upstream EvaluationContext.resolveRef; core-created ActionPlan objects retain provenance; host-authored plans execute at the native boundary',
      authoring: {
        rules: ['lang-core createLibrary', 'lang-core library.extend', 'lang-core compileSchema', 'lang-core schemaSignature/buildSignature'],
        transport: 'Pinned Zod fromJSONSchema plus JSON/Zod reference identity. LibrarySpec and signatures come directly from the shared core.',
        removedNativeRules: ['component/call naming and parameter-order checks', 'namespace/group validation copies', 'JSON Schema compiler and action-ref inlining', 'slot add/remove/override algorithms', 'signature type rendering', 'static action schema copies'],
      },
      hostCapabilities: [
        'UTF-8 encoding for WHATWG URL',
        'timers and tool Promise callbacks',
        'bounded no-flag ECMAScript pattern validation',
      ],
      compatibility: [
        'serializer precedence and lossless keys',
        'materialization depth/node budgets',
      ],
      retainedPatches: [
        {
          module: 'parser/serialize.ts',
          reason: 'Pinned serializer loses grouping and fails to quote nonidentifier keys during editing round trips.',
          removal: 'Adopt an upstream release with equivalent verified round-trip fixes.',
        },
        {
          module: 'parser/materialize.ts',
          reason: 'Preserve tested 256-level and 100000-node bounds for native model input.',
          removal: 'Equivalent shared-core or host execution bounds verified on Apple runtimes.',
        },
        {
          module: 'utils/validation.ts',
          reason: 'Delegate pattern execution to the existing bounded native backend; stock JSC RegExp has no portable per-call budget.',
          removal: 'Equivalent bounded pattern execution in the shared core or host runtime.',
        },
      ],
      removedSemanticOverrides: [
        'raw message context API compatibility',
        'batch parsing on streaming finalization and implicit stream reset',
        'legacy schema spelling, ordered-wire and signature projection',
        'Store shallow-object identity replacement',
        'merge duplicate-ID normalization',
        'extra slot, branch, template and argument validation',
        'Query/Mutation statement-reference expansion',
        'query retry suppression and skipInitialFetch',
        'evaluator capture dispatch and native-plan provenance exemption',
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(readFileSync(join(out, 'core-manifest.json'), 'utf8'));
