# Internal regular expression backend

QuickJS-NG v0.17.0, commit `6d46d07d04041b40f4f49eaa7fdebe44c314c699`.
Only libregexp, libunicode, and their required headers are included. No JavaScript VM or host bindings.
Vendor sources are unmodified; see vendor/LICENSE.

The SwiftPM product remains OpenUILang. The target compiles only Bridge.c,
RegExpEngine.c, and UnicodeEngine.c. Prefix.h namespaces vendor exports to
`openui_`, allowing a host to embed its own QuickJS copy. The public C header
exports only the test bridge; source files contain no host I/O or JavaScript VM.

Bridge input is raw UTF-16. Pattern encoding uses CESU-8 so non-Unicode mode
parses both surrogate halves as separate atoms; input uses the engine's UTF-16
buffer mode. Compile flags are zero. Results distinguish match, no match,
invalid syntax, and resource exhaustion. Pattern syntax failure follows the
TypeScript validator's skip behavior; resource exhaustion fails validation.

Per-call budgets: 65,536 pattern units, 1,048,576 input units, 8 MiB allocator
usage, 256 KiB C stack growth, and 1,000 engine timeout checks. No shared mutable
engine state is used. The wrapper releases its pattern, bytecode, captures,
and engine temporary allocations before returning. Engine work counters are
deterministic budgets, not a wall-clock timeout guarantee.

For an update, pin a release commit, retain the original license, replace all
required vendor files as one set, regenerate VENDOR.json SHA256 entries and
Prefix.h against actual exported symbols, then run the native semantic oracle,
resource-limit checks, sanitizer smoke checks, and native consumer builds.
Do not change vendor sources to approximate an ICU translation.
