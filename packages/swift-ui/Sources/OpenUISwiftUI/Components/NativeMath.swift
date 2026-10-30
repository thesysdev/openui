import SwiftUI
import WebKit
#if os(iOS)
import UIKit
typealias MathPlatformView = UIView
typealias MathPlatformImage = UIImage
#else
import AppKit
typealias MathPlatformView = NSView
typealias MathPlatformImage = NSImage
#endif

struct NativeMathImage: @unchecked Sendable {
  let image: MathPlatformImage
  let size: CGSize
  let baseline: CGFloat
  @MainActor func swiftUIImage(label: String) -> Image {
    #if os(iOS)
    let adjusted = image.withBaselineOffset(fromBottom: baseline)
    adjusted.accessibilityLabel = label
    return Image(uiImage: adjusted)
    #else
    return Image(nsImage: image)
    #endif
  }
}

/// A message-owned renderer. KaTeX supplies the layout; WebKit rasterizes only
/// the trusted, self-contained equation and bundled fonts. Paragraphs, tables,
/// links and controls remain native. No external math resource is requested.
@MainActor final class NativeMathRenderer: ObservableObject {
  private weak var host: MathPlatformView?
  private var jobs: [UUID: NativeMathJob] = [:]
  private var cache: [String: NativeMathImage] = [:]
  private var order: [String] = []

  fileprivate func attach(_ view: MathPlatformView) {
    host = view
    guard view.window != nil else { return }
    for job in jobs.values { job.start(in: view) }
  }
  func cancel() {
    for job in Array(jobs.values) { job.finish(.failure(CancellationError())) }
  }
  func image(for descriptor: NativeMathDescriptor, fontSize: CGFloat, color: String) async throws -> NativeMathImage {
    let key = descriptor.tex.utf8.map { String(format: "%02x", $0) }.joined()
      + ":\(descriptor.display):\(fontSize):\(color)"
    if let image = cache[key] { return image }
    let html = try await Task.detached(priority: .userInitiated) {
      try NativeRichTextEngine.shared.mathHTML(descriptor)
    }.value
    try Task.checkCancellation()
    let id = UUID()
    return try await withTaskCancellationHandler(operation: {
      try await withCheckedThrowingContinuation { continuation in
        guard !Task.isCancelled else { continuation.resume(throwing: CancellationError()); return }
        let job = NativeMathJob(html: html, fontSize: fontSize, color: color) { [weak self] result in
          self?.jobs.removeValue(forKey: id)
          if case .success(let image) = result {
            self?.cache[key] = image
            self?.order.append(key)
            if let self, order.count > 32 { cache.removeValue(forKey: order.removeFirst()) }
          }
          continuation.resume(with: result)
        }
        jobs[id] = job
        if let host, host.window != nil { job.start(in: host) }
      }
    }, onCancel: { [weak self] in
      Task { @MainActor in self?.jobs[id]?.finish(.failure(CancellationError())) }
    })
  }
}

@MainActor private final class NativeMathJob: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
  private let html: String
  private let fontSize: CGFloat
  private let color: String
  private var completion: ((Result<NativeMathImage, Error>) -> Void)?
  private var webView: WKWebView?
  private var timeout: Task<Void, Never>?
  private var snapshotting = false

  init(html: String, fontSize: CGFloat, color: String, completion: @escaping (Result<NativeMathImage, Error>) -> Void) {
    self.html = html; self.fontSize = fontSize; self.color = color; self.completion = completion
    super.init()
    timeout = Task { @MainActor [weak self] in
      do { try await Task.sleep(nanoseconds: 10_000_000_000) } catch { return }
      self?.finish(.failure(URLError(.timedOut)))
    }
  }
  func start(in host: MathPlatformView) {
    guard webView == nil, completion != nil else { return }
    guard let url = NativeControlResources.bundle.url(forResource: "rich-math", withExtension: "css"),
      let css = try? String(contentsOf: url, encoding: .utf8)
    else { finish(.failure(NativeRichTextError.missingResource)); return }
    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .nonPersistent()
    configuration.userContentController.add(self, name: "mathSize")
    let view = WKWebView(frame: CGRect(x: 0, y: 0, width: 1024, height: 512), configuration: configuration)
    view.navigationDelegate = self
    #if os(iOS)
    view.isOpaque = false; view.backgroundColor = .clear
    #endif
    webView = view
    host.addSubview(view)
    let document = """
      <!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; script-src 'unsafe-inline'">
      <style>\(css)
      html,body{margin:0;padding:0;background:transparent;font-size:\(fontSize)px;color:\(color)}
      #equation{display:inline-block;padding:1px;white-space:nowrap} .katex-display{margin:0}
      #baseline{display:inline-block;width:0;height:0;vertical-align:baseline}</style>
      </head><body><span id="equation">\(html)<span id="baseline"></span></span>
      <script>document.fonts.ready.then(function(){requestAnimationFrame(function(){
        var r=document.getElementById('equation').getBoundingClientRect();
        var b=document.getElementById('baseline').getBoundingClientRect();
        window.webkit.messageHandlers.mathSize.postMessage({width:Math.ceil(r.width),height:Math.ceil(r.height),baseline:r.bottom-b.top});
      });});</script></body></html>
      """
    view.loadHTMLString(document, baseURL: nil)
  }
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard !snapshotting, let body = message.body as? [String: NSNumber], let view = webView else { return }
    let width = body["width"]?.doubleValue ?? 0, height = body["height"]?.doubleValue ?? 0
    guard width.isFinite, height.isFinite, width > 0, height > 0,
      width <= 8192, height <= 4096, width * height <= 4_000_000 else {
      finish(.failure(URLError(.dataLengthExceedsMaximum))); return
    }
    snapshotting = true
    let size = CGSize(width: width, height: height)
    view.frame.size = size
    let configuration = WKSnapshotConfiguration()
    configuration.rect = CGRect(origin: .zero, size: size)
    configuration.afterScreenUpdates = true
    view.takeSnapshot(with: configuration) { [weak self] image, error in
      Task { @MainActor in
        guard let self else { return }
        if let image {
          self.finish(.success(NativeMathImage(image: image, size: size, baseline: max(0, body["baseline"]?.doubleValue ?? 0))))
        } else { self.finish(.failure(error ?? URLError(.cannotDecodeContentData))) }
      }
    }
  }
  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { finish(.failure(error)) }
  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { finish(.failure(error)) }
  func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    decisionHandler(navigationAction.request.url?.scheme == "about" ? .allow : .cancel)
  }
  func finish(_ result: Result<NativeMathImage, Error>) {
    guard let completion else { return }
    self.completion = nil
    timeout?.cancel(); timeout = nil
    webView?.configuration.userContentController.removeScriptMessageHandler(forName: "mathSize")
    webView?.navigationDelegate = nil
    webView?.stopLoading(); webView?.removeFromSuperview(); webView = nil
    completion(result)
  }
}

#if os(iOS)
private final class NativeMathHostView: UIView {
  weak var renderer: NativeMathRenderer?
  override func didMoveToWindow() { super.didMoveToWindow(); renderer?.attach(self) }
}
struct NativeMathHost: UIViewRepresentable {
  let renderer: NativeMathRenderer
  func makeUIView(context: Context) -> UIView {
    let view = NativeMathHostView(); view.renderer = renderer; view.clipsToBounds = true
    renderer.attach(view); return view
  }
  func updateUIView(_ view: UIView, context: Context) { renderer.attach(view) }
}
#else
private final class NativeMathHostView: NSView {
  weak var renderer: NativeMathRenderer?
  override func viewDidMoveToWindow() { super.viewDidMoveToWindow(); renderer?.attach(self) }
}
struct NativeMathHost: NSViewRepresentable {
  let renderer: NativeMathRenderer
  func makeNSView(context: Context) -> NSView {
    let view = NativeMathHostView(); view.renderer = renderer; view.wantsLayer = true; view.layer?.masksToBounds = true
    renderer.attach(view); return view
  }
  func updateNSView(_ view: NSView, context: Context) { renderer.attach(view) }
}
#endif
