# Author-time program validation

This SDK-owned Node API/CLI invokes the exact JavaScript core shipped with the
Apple SDK. It is a static author-delivery check, not a Swift Linux runtime or a
second parser. It requires Node 18+ and no npm install, renderer or network.
The bundle and its documented compatibility corrections remain unchanged.

```sh
node packages/swift-lang/validation/cli.mjs --contract /path/to/contracts source.openui
cat source.openui | node packages/swift-lang/validation/cli.mjs --contract /path/to/contracts -
```

```js
import { loadValidator } from './api.mjs';
const validator = loadValidator({ contractDirectory: '/path/to/contracts' });
const report = validator.validate(source);
// Return report.meta.errors to the same author before accepting its delivery.
```

For an already trusted in-memory snapshot, `createValidator({schema, library})`
uses the same engine without loading files. File-based loading verifies the
four-file export's hashes, identity and matching schema. JSON property order is
the positional argument order: do not sort schema properties. Contract
`sdkCommit` identifies the native contract producer; the validator's release
commit and core hash are recorded separately. A tooling-only release can use
an unchanged native contract when the exact core and schema remain aligned.

`meta` and its diagnostics are returned unchanged from `createParser().parse()`.
An absent severity means error; `severity: "warning"` remains a warning. A root
that survived optional-property pruning does not cancel its errors. `valid`
requires a root/root expression, complete parsing, no unresolved names and zero
error-level diagnostics. Warnings are reported and do not fail by themselves.
CLI exits: **0** valid, **1** invalid program, **2** invocation, integrity or core
runtime failure. Signatures are deduplicated diagnostic context from LibrarySpec.

Only static parsing/materialization runs. No actions, queries, mutations,
custom functions, image downloads, model calls or initial runtime expressions
are executed. `hasRootExpression` explicitly reports a deferred root. Passing
does not prove dynamic interactions, facts, source reachability or aesthetics.
The public core `validate()` utility validates form rules; it is not this DSL
program check. The VM timeout bounds each parse; process memory limits belong
to the author's existing execution boundary. Node vm is not a general-purpose
security sandbox; the only loaded executable code is the verified SDK bundle.

Build a portable offline release after committing the SDK wrapper:

```sh
node packages/swift-lang/validation/build.mjs --output /new/lang-validator \
  --contract /path/to/contracts
node /new/lang-validator/cli.mjs source.openui
node --test packages/swift-lang/validation/validation.test.mjs
```

The package contains the API/CLI, exact core, provenance/licenses and optionally
the matching contract snapshot. `validator-manifest.json` lists file hashes;
the adjacent `.tgz.sha256` records the actual archive hash. Verify that archive
hash through the SDK delivery channel before installing. The package uses Node
built-ins only and contains no Apple binary. Platform smoke results are reported
per release; Node portability is not a claim that Linux was tested when only a
macOS Node runtime was available.
