#if os(macOS)
import AppKit
import SwiftUI
import OpenUILang
import XCTest
@testable import OpenUISwiftUI

final class TableMountedViewTests:XCTestCase {
  @MainActor func testMountedSourceObservationDoesNotClearRejectedDraft() async throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema:library.library.toSchema())
    state.push("root=Stack([EditableTable(\"orders\",[{header:\"Name\",type:\"string\"}],[{id:\"r1\",values:[\"before\"]}]),TextContent(\"unfinished")
    let element = try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root)).first)
    let context = OpenUIComponentContext(element:element,registry:library.registry,state:state)
    let editing = NativeTableEditingState()
    let host = NSHostingView(rootView:NativeEditableTable(context:context,editing:editing).environmentObject(state).frame(width:350))
    let window = NSWindow(contentRect:NSRect(x:0,y:0,width:350,height:300),styleMask:[.borderless],backing:.buffered,defer:false)
    window.contentView = host
    defer { window.contentView = nil }
    host.layoutSubtreeIfNeeded()
    for _ in 0..<30 where editing.draft.rows.isEmpty { try await Task.sleep(nanoseconds:10_000_000) }
    XCTAssertEqual(editing.draft.rows.count,1,"The actual view must mount and receive its initial source")
    editing.draft.write(.string("after"),row:0,column:0)
    // Simulate publication of a local field write whose later dispatch was
    // rejected. The view's real onChange handler must retain the old baseline.
    state.setFieldValue(form:"orders",name:"orders",value:editing.draft.value,componentType:"EditableTable")
    host.layoutSubtreeIfNeeded()
    try await Task.sleep(nanoseconds:30_000_000)
    XCTAssertTrue(editing.draft.hasChanges)
    var received = 0
    state.onAction = {_ in received += 1}
    await editing.save(context:context,name:"orders",columns:1)
    await editing.save(context:context,name:"orders",columns:1)
    XCTAssertEqual(received,1)
    XCTAssertFalse(editing.draft.hasChanges)
  }
}
#endif
