import Foundation
public func mergeStatements(_ existing: String, _ patch: String, rootId: String = "root") -> String {
    let core = SharedCore.shared
    return core.sync { core.call("merge", [existing, patch, rootId]).toString() }
}
