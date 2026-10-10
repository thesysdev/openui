import OpenUILang
import SwiftUI

/// react-ui's general OpenUI library rendered with native SwiftUI views.
/// Component names and arguments match `openuiLibrary` from
/// @openuidev/react-ui (see `OpenUIComponents`), and the root is `Stack`.
///
/// It shares the chat library's views; `Stack`, `Card` (with Stack's layout
/// props) and `Modal` are its own.
public enum OpenUILibrary {
  @MainActor
  public static let library = SwiftUILibrary(
    components: OpenUIComponents.all.map { schema in
      SwiftUIComponent(
        schema,
        content: views[schema.name] ?? OpenUIChatLibrary.views[schema.name] ?? { _ in
          AnyView(EmptyView())
        })
    },
    root: "Stack",
    componentGroups: OpenUIComponents.groups)

  @MainActor
  static let views: [String: ComponentContent] = [
    "Stack": { AnyView(StackView(props: $0)) },
    "Card": { AnyView(FlexCardView(props: $0)) },
    "Modal": { AnyView(ModalView(props: $0)) },
  ]
}
