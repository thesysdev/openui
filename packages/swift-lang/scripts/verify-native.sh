#!/bin/sh
set -eu
mkdir -p work/shared-core-validation/contracts work/shared-core-validation/snapshots
run_check() {
    task_label=$1
    task_log=$2
    shift 2
    if "$@" > "$task_log" 2>&1; then
        printf '%s passed\n' "$task_label"
        tail -n 8 "$task_log"
    else
        task_exit=$?
        printf '%s failed (exit %s)\n' "$task_label" "$task_exit" >&2
        tail -n 80 "$task_log" >&2
        return "$task_exit"
    fi
}
if [ "${1:-}" != "--platforms" ]; then
run_check 'Language regression' work/shared-core-validation/lang-tests.log swift test --package-path packages/swift-lang
run_check 'SwiftUI interaction and rendering' work/shared-core-validation/ui-tests.log env OPENUI_CONTRACT_EXPORT_DIR="$PWD/work/shared-core-validation/contracts" OPENUI_SNAPSHOT_DIR="$PWD/work/shared-core-validation/snapshots" swift test --package-path packages/swift-ui
python3 - <<'PY'
from pathlib import Path
from hashlib import sha256
expected={'standard.json':'d684a4e63ac273fbcb188f1cd7a48e7ea9eb9c46b0a67f49bcc8bd87fc39dcb5','standard-with-navigation.json':'099f36ab3e634387012bb33d2f0c9d98cd87b842564479c76b2fca395a1527bb','standard-prompt.txt':'7974b836d25c56b09a856fb61845f045b96c501d211bf7e3ea90a9ad788304f3','standard-with-navigation-prompt.txt':'0d5c440d1ed1e5984286a8198258d2c37f1ade21c948e7b635d00d838bd36a3e'}
for name,want in expected.items():
 got=sha256((Path('work/shared-core-validation/contracts')/name).read_bytes()).hexdigest()
 print(name,got)
 if got!=want:raise SystemExit('Contract mismatch: '+name)
PY
fi
run_check 'Language AddressSanitizer regression' work/shared-core-validation/asan-tests.log swift test --package-path packages/swift-lang --scratch-path work/shared-core-validation/asan-build --sanitize=address
run_check 'iOS 16 Simulator compile' work/shared-core-validation/ios-build.log swift build --package-path packages/swift-ui --scratch-path work/shared-core-validation/ios-build --triple arm64-apple-ios16.0-simulator --sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)"
run_check 'macOS SDK compile' work/shared-core-validation/macos-build.log swift build --package-path packages/swift-ui --scratch-path work/shared-core-validation/macos-build
printf 'Requested native acceptance checks passed.\n'
