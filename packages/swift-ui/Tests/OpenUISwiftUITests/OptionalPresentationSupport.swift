import OpenUISwiftUI

func installingPresentation(into base: OpenUIComponentLibrary) throws -> OpenUIComponentLibrary {
    try OpenUIWebComponents.install(into: OpenUIPopoverComponents.install(into: base))
}
