import Foundation
import OpenUILang
import SwiftUI
import WebKit

/// Opt-in embedded presentation primitives in OpenUISwiftUI. They do not change the upstream catalog.
public enum OpenUIWebComponents {
    public static func install(into base: OpenUIComponentLibrary) throws -> OpenUIComponentLibrary {
        let height = ParamDef(name: "height", required: false, schema: .object([
            .init(key: "type", value: .string("number")), .init(key: "minimum", value: .number(1))
        ]))
        let svg = OpenUIComponent(name: "SVG", description: """
            A scalable vector illustration, diagram or custom data graphic. Supply a complete SVG
            document in content, or its resource URL in src. Never invent an image URL. The viewBox
            determines proportions; omitted height follows its actual rendered content. alt describes
            its meaning and provides a readable fallback. For inline graphics use
            SVG(content, null, alt, height): src is a resource URL, never an identifier.
            Valid inline content takes precedence if both sources are supplied. Keep essential
            facts in native text/charts as well. Scripts are disabled. Prefer standard charts for ordinary numeric data.
            """, params: [OpenUIParameter.string("content", required: false), OpenUIParameter.string("src", required: false),
                OpenUIParameter.string("alt", required: false), height]) { NativeEmbeddedContent(context: $0, svg: true) }
        let web = OpenUIComponent(name: "WebView", description: """
            Embedded web content for an existing webpage or a self-contained HTML visualization
            that native components cannot express. Supply html or src, not both. Omitted height
            follows content; an explicit height creates a scrollable viewport. Links open through
            the normal URL handler. Prefer native components for ordinary cards, forms and text.
            Page JavaScript is disabled by default and controlled by SDK policy, never by generated content.
            """, params: [OpenUIParameter.string("html", required: false), OpenUIParameter.string("src", required: false),
                OpenUIParameter.string("title", required: false), height]) { NativeEmbeddedContent(context: $0, svg: false) }
        let names = ["SVG", "WebView"]
        return try base.extending(adding: [svg, web], slots: Dictionary(uniqueKeysWithValues:
            names.map { ($0, base.standardContentSlots) }))
    }
}

/// Web execution is an application capability, not a model-controlled flag.
public struct OpenUIWebPolicy {
    public var allowsJavaScript: Bool
    public init(allowsJavaScript: Bool = false) { self.allowsJavaScript = allowsJavaScript }
}
private struct NativeWebPolicyKey: EnvironmentKey { static let defaultValue = OpenUIWebPolicy() }
extension EnvironmentValues {
    public var openUIWebPolicy: OpenUIWebPolicy {
        get { self[NativeWebPolicyKey.self] }
        set { self[NativeWebPolicyKey.self] = newValue }
    }
}
extension View {
    public func openUIWebPolicy(_ policy: OpenUIWebPolicy) -> some View { environment(\.openUIWebPolicy, policy) }
}

enum NativeSVGDocument {
    struct Prepared { let html: String; let aspectRatio: CGFloat? }
    static func html(_ content: String, alt: String) -> String? {
        prepare(content, alt: alt)?.html
    }
    static func prepare(_ content: String, alt: String) -> Prepared? {
        guard let bytes = content.data(using: .utf8) else { return nil }
        let validator = Validator()
        let parser = XMLParser(data: bytes)
        parser.shouldResolveExternalEntities = false
        parser.delegate = validator
        guard parser.parse(), validator.rootIsSVG else { return nil }
        let html = """
        <!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: http: data:; font-src data:; script-src 'none'">
        <style>html,body{margin:0;padding:0;background:transparent;font-family:-apple-system,system-ui,sans-serif}body>div>svg{display:block;width:100%;max-width:100%;height:auto}body>div{width:100%}</style>
        </head><body><div role="img" aria-label="\(escape(alt))">\(content)</div></body></html>
        """
        return Prepared(html: html, aspectRatio: validator.aspectRatio)
    }
    static func escape(_ text: String) -> String {
        text.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "<", with: "&lt;").replacingOccurrences(of: ">", with: "&gt;")
    }
    private final class Validator: NSObject, XMLParserDelegate {
        var rootIsSVG = false
        var aspectRatio: CGFloat?
        private var depth = 0
        func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?,
                    qualifiedName qName: String?, attributes: [String: String] = [:]) {
            if depth == 0 {
                rootIsSVG = elementName.lowercased() == "svg"
                let box = attributes["viewBox"]?.split { $0.isWhitespace || $0 == "," }.compactMap { Double($0) } ?? []
                if box.count == 4, box.allSatisfy(\.isFinite), box[2] > 0, box[3] > 0 {
                    let ratio = box[2] / box[3]
                    // Pre-size ordinary illustrations; unusual documents keep
                    // the existing measured-content path instead of huge guesses.
                    if ratio.isFinite, (0.05...50).contains(ratio) { aspectRatio = CGFloat(ratio) }
                }
            }
            depth += 1
        }
        func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) { depth -= 1 }
        func parser(_ parser: XMLParser, foundInternalEntityDeclarationWithName name: String, value: String?) { parser.abortParsing() }
        func parser(_ parser: XMLParser, foundExternalEntityDeclarationWithName name: String, publicID: String?, systemID: String?) { parser.abortParsing() }
    }
}

enum NativeEmbeddedPlan: Equatable {
    case pending, inline(String, CGFloat?), remote, unavailable, networkFailure
    static func resolve(svg: Bool, inline: String?, title: String, sourceReady: Bool, hasResource: Bool) -> Self {
        guard sourceReady else { return .pending }
        if let inline, !inline.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            if !svg { return .inline(inline, nil) }
            guard let document = NativeSVGDocument.prepare(inline, alt: title) else { return .unavailable }
            return .inline(document.html, document.aspectRatio)
        }
        return hasResource ? .remote : .unavailable
    }
}

private struct NativeEmbeddedInput: Hashable {
    let svg: Bool
    let inline: String?
    let resource: WebResourceRequestID
    let title: String
    let sourceReady: Bool
    let baseURL: URL?
    let javaScript: Bool
}

private struct NativeEmbeddedContent: View {
    let context: OpenUIComponentContext
    let svg: Bool
    @Environment(\.openUIResourceContext) private var resources
    @Environment(\.openUIWebPolicy) private var webPolicy
    @Environment(\.openURL) private var openURL
    @State private var plan = NativeEmbeddedPlan.pending
    @State private var preparedInput: NativeEmbeddedInput?
    @State private var preparedOwner: (any OpenUIResourceLoading)?
    @State private var failed = false
    @State private var measuredHeight: CGFloat = 44
    @State private var measuredInput: NativeEmbeddedInput?
    @State private var width: CGFloat = 0
    @State private var attempt = 0
    @Namespace private var webInstance
    private var input: NativeEmbeddedInput {
        let ready = context.element.isSourceComplete
        let text = ready ? context.string(svg ? "content" : "html") : nil
        let inline = text?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false ? text : nil
        // Inline content is authoritative; a second optional field must not
        // turn a valid illustration into a permanent error or a dead retry.
        var request = ready && inline == nil ? resources.request(for: context.string("src")) : nil
        if attempt > 0 { request?.cachePolicy = .reloadIgnoringLocalCacheData }
        return NativeEmbeddedInput(svg: svg, inline: inline,
            resource: .init(request: request, loader: ObjectIdentifier(resources.loader), attempt: attempt),
            title: ready ? context.string(svg ? "alt" : "title") ?? "" : "",
            sourceReady: ready, baseURL: resources.baseURL, javaScript: !svg && webPolicy.allowsJavaScript)
    }
    private var presentation: NativeEmbeddedPlan {
        if preparedInput == input { return plan }
        if let previous = preparedInput, previous.inline != nil, input.inline != nil,
           previous.svg == input.svg, previous.resource.loader == input.resource.loader,
           previous.baseURL == input.baseURL, previous.javaScript == input.javaScript,
           case .inline = plan { return plan }
        return .pending
    }
    var body: some View {
        let current = input
        let loader = resources.loader
        Group {
            if failed && preparedInput == current { fallback(retry: true) }
            else {
                switch presentation {
                case .inline(let html, let ratio):
                    surface(html: html, request: nil, ratio: ratio, input: current)
                case .remote where !svg:
                    surface(html: nil, request: current.resource.request, ratio: nil, input: current)
                case .networkFailure: fallback(retry: true)
                case .unavailable: fallback(retry: false)
                default:
                    ProgressView().controlSize(.small)
                        .frame(maxWidth: .infinity, minHeight: CGFloat(current.sourceReady ? context.number("height") ?? 44 : 44))
                        .accessibilityIdentifier(svg ? "openui.svg.loading" : "openui.web.loading")
                }
            }
        }
        .task(id: current) {
            guard !Task.isCancelled else { return }
            failed = false
            let next = NativeEmbeddedPlan.resolve(svg: svg, inline: current.inline, title: current.title,
                sourceReady: current.sourceReady, hasResource: current.resource.request != nil)
            if !svg, preparedInput != current { measuredHeight = 44 }
            preparedOwner = loader
            preparedInput = current
            plan = next
            guard case .remote = next, svg, let request = current.resource.request else { return }
            do {
                let bytes = try await loader.data(for: request)
                try Task.checkCancellation()
                guard let text = String(data: bytes, encoding: .utf8),
                    let document = NativeSVGDocument.prepare(text, alt: current.title) else {
                    plan = .unavailable; return
                }
                plan = .inline(document.html, document.aspectRatio)
            } catch { if !Task.isCancelled { plan = .networkFailure } }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(svg ? "openui.svg" : "openui.web")
    }
    @ViewBuilder private func surface(html: String?, request: URLRequest?, ratio: CGFloat?, input: NativeEmbeddedInput) -> some View {
        let measured = Binding(get: { measuredHeight }, set: { value in
            measuredHeight = value; measuredInput = input
        })
        let view = NativeWebSurface(html: html, request: request, baseURL: resources.baseURL,
            javaScript: input.javaScript, scrolls: context.number("height") != nil,
            measuresSVG: svg, title: input.title, resources: resources,
            measuredHeight: measured, failed: $failed, open: { url in
                guard preparedInput == input, context.canActivate else { return }
                openURL(url)
            })
            .id(WebPresentationIdentity(instance: webInstance, svg: svg, javaScript: input.javaScript))
        let predicted = ratio.flatMap { width > 0 ? width / $0 : nil }
        let height = context.number("height").map { CGFloat($0) }
            ?? (measuredInput == input ? measuredHeight : predicted ?? measuredHeight)
        Color.clear.frame(maxWidth: .infinity).frame(height: height).overlay { view }.clipped()
            .background(GeometryReader { size in
                Color.clear.preference(key: NativeEmbeddedWidthKey.self, value: size.size.width)
            })
            .onPreferenceChange(NativeEmbeddedWidthKey.self) { next in
                if next.isFinite, next > 0, abs(next - width) > 0.5 { width = next }
            }
    }
    private func fallback(retry: Bool) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: context.theme.spacing("s")) {
            if let description = context.string(svg ? "alt" : "title"), !description.isEmpty {
                Text(description).openUIFont(context.theme.typography.caption)
            } else {
                Text(svg ? "Illustration unavailable" : "Content unavailable", bundle: NativeControlResources.bundle)
                    .openUIFont(context.theme.typography.caption)
            }
            Spacer(minLength: 0)
            if retry {
                Button {
                    guard context.canActivate else { return }
                    failed = false; attempt += 1
                } label: {
                    Text("Reload", bundle: NativeControlResources.bundle).openUIFont(context.theme.typography.actionCompact).openUIControlTarget()
                }.buttonStyle(.plain).disabled(!context.canInteract)
            }
        }.foregroundStyle(context.theme.secondary)
          .accessibilityIdentifier(svg ? "openui.svg.fallback" : "openui.web.fallback")
    }
}

private struct NativeEmbeddedWidthKey: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}

private struct WebPresentationIdentity: Hashable {
    let instance: Namespace.ID
    let svg: Bool
    let javaScript: Bool
}

#if os(iOS)
private struct NativeWebSurface: UIViewRepresentable {
    let html: String?
    let request: URLRequest?
    let baseURL: URL?
    let javaScript: Bool
    let scrolls: Bool
    let measuresSVG: Bool
    let title: String
    let resources: OpenUIResourceContext
    @Binding var measuredHeight: CGFloat
    @Binding var failed: Bool
    let open: (URL) -> Void
    func makeCoordinator() -> NativeWebCoordinator { NativeWebCoordinator(owner: self) }
    func makeUIView(context: Context) -> WKWebView { context.coordinator.makeView() }
    func updateUIView(_ view: WKWebView, context: Context) { context.coordinator.update(self, view: view) }
    static func dismantleUIView(_ view: WKWebView, coordinator: NativeWebCoordinator) { coordinator.dispose(view) }
}
#else
private struct NativeWebSurface: NSViewRepresentable {
    let html: String?
    let request: URLRequest?
    let baseURL: URL?
    let javaScript: Bool
    let scrolls: Bool
    let measuresSVG: Bool
    let title: String
    let resources: OpenUIResourceContext
    @Binding var measuredHeight: CGFloat
    @Binding var failed: Bool
    let open: (URL) -> Void
    func makeCoordinator() -> NativeWebCoordinator { NativeWebCoordinator(owner: self) }
    func makeNSView(context: Context) -> WKWebView { context.coordinator.makeView() }
    func updateNSView(_ view: WKWebView, context: Context) { context.coordinator.update(self, view: view) }
    static func dismantleNSView(_ view: WKWebView, coordinator: NativeWebCoordinator) { coordinator.dispose(view) }
}
#endif

@MainActor private final class NativeWebCoordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
    var owner: NativeWebSurface
    private var lastHTML: String?
    private var lastRequest: URLRequest?
    private var lastBaseURL: URL?
    private var loaded = false
    private var navigation: WKNavigation?
    init(owner: NativeWebSurface) { self.owner = owner }
    func makeView() -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = owner.javaScript
        // Measurement executes in the SDK's isolated world, without enabling
        // page scripts or providing model content with a native action bridge.
        configuration.userContentController.add(self, contentWorld: .defaultClient, name: "openuiSize")
        configuration.userContentController.addUserScript(WKUserScript(source: """
            (()=>{if(!document.querySelector('meta[name="viewport"]')){const m=document.createElement('meta');m.name='viewport';m.content='width=device-width,initial-scale=1';document.head.appendChild(m)}
            let last=0;const report=()=>{const target=\(owner.measuresSVG ? "document.body.firstElementChild" : "document.documentElement");const h=Math.ceil(target?.getBoundingClientRect().height??0);
            if(h>0&&h!==last){last=h;window.webkit.messageHandlers.openuiSize.postMessage(h)}};
            new ResizeObserver(report).observe(document.documentElement);report()})();
            """, injectionTime: .atDocumentEnd, forMainFrameOnly: true, in: .defaultClient))
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = self
        #if os(iOS)
        view.isOpaque = false; view.backgroundColor = .clear; view.scrollView.backgroundColor = .clear
        #endif
        return view
    }
    func update(_ owner: NativeWebSurface, view: WKWebView) {
        self.owner = owner
        #if os(iOS)
        view.scrollView.isScrollEnabled = owner.scrolls
        view.accessibilityLabel = owner.title
        #else
        view.setAccessibilityLabel(owner.title)
        #endif
        guard !loaded || owner.html != lastHTML || owner.request != lastRequest || owner.baseURL != lastBaseURL else { return }
        loaded = true; lastHTML = owner.html; lastRequest = owner.request; lastBaseURL = owner.baseURL
        if let html = owner.html { navigation = view.loadHTMLString(html, baseURL: owner.baseURL) }
        else if let request = owner.request { navigation = view.load(request) }
    }
    func dispose(_ view: WKWebView) {
        view.stopLoading(); view.navigationDelegate = nil
        view.configuration.userContentController.removeScriptMessageHandler(forName: "openuiSize", contentWorld: .defaultClient)
    }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let number = message.body as? NSNumber,
              number.doubleValue.isFinite, number.doubleValue > 0 else { return }
        let height = max(1, CGFloat(number.doubleValue))
        if abs(height - owner.measuredHeight) > 0.5 { owner.measuredHeight = height }
    }
    func webView(_ view: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if url.absoluteString == "about:blank" { decisionHandler(.allow); return }
        guard let resolved = owner.resources.request(for: url.absoluteString)?.url else { decisionHandler(.cancel); return }
        if action.navigationType == .linkActivated || action.targetFrame == nil {
            owner.open(resolved); decisionHandler(.cancel)
        } else { decisionHandler(.allow) }
    }
    func webView(_ view: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if navigation === self.navigation, (error as NSError).code != NSURLErrorCancelled { owner.failed = true }
    }
    func webView(_ view: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if navigation === self.navigation, (error as NSError).code != NSURLErrorCancelled { owner.failed = true }
    }
}

private struct WebResourceRequestID: Hashable {
    let request: URLRequest?
    let loader: ObjectIdentifier
    let attempt: Int
}
