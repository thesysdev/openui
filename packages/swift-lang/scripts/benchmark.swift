// Run after the macOS package suite. Development measurement; no product target.
import Foundation
import JavaScriptCore
import Darwin
@testable import OpenUILang

func residentBytes() -> UInt64 {
    var info = mach_task_basic_info()
    var size = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size / MemoryLayout<integer_t>.size)
    let status = withUnsafeMutablePointer(to: &info) { pointer in
        pointer.withMemoryRebound(to: integer_t.self, capacity: Int(size)) {
            task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &size)
        }
    }
    return status == KERN_SUCCESS ? UInt64(info.resident_size) : 0
}
let spec = try LibrarySpec(jsonString: String(contentsOfFile: "spec/fixtures/1.0/library.json", encoding: .utf8))
let schema = compileLibrarySchema(spec)
let source = "$n = 1\nroot = Stack([" + (0..<30).map { "Text(\"row \($0) \" + $n)" }.joined(separator: ",") + "])"
var timings: [Double] = []
func frame() {
    let parser = createParser(schema: schema)
    let result = parser.parse(source)
    let store = createStore();store.initialize(defaults: result.stateDeclarations, persisted: [:])
    let evaluator = Evaluator(context: EvaluationContext(getState: { store.get($0) ?? .null }, resolveRef: { _ in .null }), store: store, schema: schema)
    guard evaluator.evaluateRoot(result)?.typeName == "Stack", result.meta.errors.isEmpty else { fatalError("Invalid benchmark tree") }
    for n in 2...4 { store.set("$n", value: .number(Double(n)), pristine: false);_ = evaluator.evaluateRoot(result) }
}
for _ in 0..<10 { autoreleasepool { frame() } }
SharedCore.shared.sync { JSGarbageCollect(SharedCore.shared.context.jsGlobalContextRef) }
let before = residentBytes()
var residentSamples: [UInt64] = [before]
for index in 0..<500 {
    autoreleasepool {
        let start = CFAbsoluteTimeGetCurrent();frame()
        timings.append((CFAbsoluteTimeGetCurrent() - start) * 1000)
    }
    if (index + 1) % 100 == 0 {
        for _ in 0..<32 { SharedCore.shared.sync { _ = SharedCore.shared.call("truth", [true]) } }
        SharedCore.shared.sync { JSGarbageCollect(SharedCore.shared.context.jsGlobalContextRef) }
        residentSamples.append(residentBytes())
    }
}
// Weak bridge tables are pruned at transaction boundaries; request GC after the
// workload so retained growth can be distinguished from unreclaimed VM space.
for _ in 0..<32 { SharedCore.shared.sync { _ = SharedCore.shared.call("truth", [true]) } }
SharedCore.shared.sync { JSGarbageCollect(SharedCore.shared.context.jsGlobalContextRef) }
let after = residentBytes()
timings.sort()
let report: [String:Any] = ["build":"macOS debug core, optimized measurement driver", "programBytes":source.utf8.count,"components":31,"iterations":500,"perIteration":"parse + initial render-tree evaluation + 3 state writes and reevaluations", "p50Milliseconds":timings[timings.count / 2],"p95Milliseconds":timings[Int(Double(timings.count) * 0.95)],"maxMilliseconds":timings.last!,"residentSamplesEvery100Iterations":residentSamples,"residentBefore":before,"residentAfter":after,"residentGrowth":Int64(after)-Int64(before),"limits":"Not a UI frame-rate, physical-device, release-build or exhaustive memory-leak profile"]
let data = try JSONSerialization.data(withJSONObject:report,options:[.prettyPrinted,.sortedKeys])
try data.write(to:URL(fileURLWithPath:"work/shared-core-validation/benchmark.json"))
print(String(data:data,encoding:.utf8)!)
