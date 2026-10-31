import MapKit
import OpenUILang
import SwiftUI

#if os(iOS)
  import UIKit
  private typealias NativeMapColor = UIColor
#elseif os(macOS)
  import AppKit
  private typealias NativeMapColor = NSColor
#endif

/// Thin MapKit bridge. UI state remains in OpenUIState; MapKit owns only camera
/// position, annotation hit targets and the supplied polyline overlays.
#if os(iOS)
  struct NativeMapCanvas: UIViewRepresentable {
    let data: NativeMapData
    @Binding var selection: OpenUIString?
    let canInteract: Bool
    let accent: Color
    var bottomInset: CGFloat = 0
    var trailingInset: CGFloat = 28
    var topInset: CGFloat = 56
    var resetCamera = 0

    func makeCoordinator() -> NativeMapCoordinator {
      NativeMapCoordinator(onSelection: { selection = $0 })
    }
    func makeUIView(context: Context) -> MKMapView { nativeMap(context.coordinator) }
    func updateUIView(_ view: MKMapView, context: Context) {
      context.coordinator.onSelection = { selection = $0 }
      context.coordinator.update(
        view, data: data, selected: selection, canInteract: canInteract, accent: accent, bottomInset: bottomInset, trailingInset: trailingInset, topInset: topInset, resetCamera: resetCamera)
    }
    static func dismantleUIView(_ view: MKMapView, coordinator: NativeMapCoordinator) {
      view.delegate = nil
    }
  }
#elseif os(macOS)
  struct NativeMapCanvas: NSViewRepresentable {
    let data: NativeMapData
    @Binding var selection: OpenUIString?
    let canInteract: Bool
    let accent: Color
    var bottomInset: CGFloat = 0
    var trailingInset: CGFloat = 28
    var topInset: CGFloat = 56
    var resetCamera = 0

    func makeCoordinator() -> NativeMapCoordinator {
      NativeMapCoordinator(onSelection: { selection = $0 })
    }
    func makeNSView(context: Context) -> MKMapView { nativeMap(context.coordinator) }
    func updateNSView(_ view: MKMapView, context: Context) {
      context.coordinator.onSelection = { selection = $0 }
      context.coordinator.update(
        view, data: data, selected: selection, canInteract: canInteract, accent: accent, bottomInset: bottomInset, trailingInset: trailingInset, topInset: topInset, resetCamera: resetCamera)
    }
    static func dismantleNSView(_ view: MKMapView, coordinator: NativeMapCoordinator) {
      view.delegate = nil
    }
  }
#endif

@MainActor private func nativeMap(_ coordinator: NativeMapCoordinator) -> MKMapView {
  let view = NativeSizingMapView()
  view.onSizeChange = { [weak coordinator] view in coordinator?.viewportChanged(view) }
  view.delegate = coordinator
  view.mapType = .standard
  view.pointOfInterestFilter = .excludingAll
  view.showsUserLocation = false
  view.isRotateEnabled = false
  view.isPitchEnabled = false
  #if os(iOS)
    view.accessibilityIdentifier = "openui.map.canvas"
  #else
    view.setAccessibilityIdentifier("openui.map.canvas")
  #endif
  return view
}

private final class NativeSizingMapView: MKMapView {
  var onSizeChange: (@MainActor (MKMapView) -> Void)?
  private var previousSize = CGSize.zero
  #if os(iOS)
  override func layoutSubviews() { super.layoutSubviews(); reportSize() }
  #else
  override func layout() { super.layout(); reportSize() }
  #endif
  private func reportSize() {
    guard bounds.width > 0, bounds.height > 0,
      abs(bounds.width - previousSize.width) > 0.5 || abs(bounds.height - previousSize.height) > 0.5 else { return }
    previousSize = bounds.size
    onSizeChange?(self)
  }
}

@MainActor
final class NativeMapCoordinator: NSObject, MKMapViewDelegate {
  var onSelection: (OpenUIString) -> Void
  private var lastData: NativeMapData?
  private var lastSelection: OpenUIString?
  private var applying = false
  private var lineColor = NativeMapColor.systemBlue
  private var interactive = false
  private var bottomInset: CGFloat = 0
  private var trailingInset: CGFloat = 28
  private var topInset: CGFloat = 56
  private var lastCameraReset = 0
  private var userAdjustedCamera = false
  private var lastAccent: Color?

  init(onSelection: @escaping (OpenUIString) -> Void) {
    self.onSelection = onSelection
  }

  func viewportChanged(_ view: MKMapView) {
    if !userAdjustedCamera { fit(view) }
  }

  func update(
    _ view: MKMapView, data: NativeMapData, selected: OpenUIString?,
    canInteract: Bool, accent: Color, bottomInset: CGFloat = 0, trailingInset: CGFloat = 28,
    topInset: CGFloat = 56, resetCamera: Int = 0
  ) {
    let interactionChanged = lastData == nil || interactive != canInteract
    interactive = canInteract
    let accentChanged = lastAccent != accent
    lastAccent = accent
    lineColor = NativeMapColor(accent)
    let insetChanged = abs(self.bottomInset - bottomInset) > 0.5 || abs(self.trailingInset - trailingInset) > 0.5 || abs(self.topInset - topInset) > 0.5
    self.bottomInset = max(0, bottomInset)
    self.trailingInset = max(28, trailingInset)
    self.topInset = max(0, topInset)
    #if os(iOS)
      if interactionChanged { view.isUserInteractionEnabled = canInteract }
    #else
      if interactionChanged { view.isScrollEnabled = canInteract; view.isZoomEnabled = canInteract }
    #endif
    if lastData != data {
      applying = true
      defer { applying = false }
      let current = view.annotations.compactMap { $0 as? NativeMapAnnotation }
      let nextByID = Dictionary(uniqueKeysWithValues: data.points.map { ($0.id, $0) })
      for old in current where nextByID[old.id] == nil { view.removeAnnotation(old) }
      let currentIDs = Set(current.map(\.id))
      for old in current {
        guard let point = nextByID[old.id] else { continue }
        let iconChanged = old.icon != point.icon
        if old.title != point.title {
          old.title = point.title
          #if os(iOS)
          view.view(for: old)?.accessibilityLabel = point.title
          #else
          view.view(for: old)?.setAccessibilityLabel(point.title)
          #endif
        }
        if iconChanged { old.icon = point.icon }
        if old.coordinate.latitude != point.coordinate.latitude || old.coordinate.longitude != point.coordinate.longitude {
          old.coordinate = point.coordinate.location
        }
        if iconChanged, let marker = view.view(for: old) as? NativeMapMarkerView {
          marker.configure(icon: point.icon, accent: NativeMapColor(accent), scale: markerScale(view))
        }
      }
      view.addAnnotations(
        data.points.filter { !currentIDs.contains($0.id) }
          .map(NativeMapAnnotation.init))
      let routesChanged = lastData?.routes != data.routes
      if routesChanged {
        view.removeOverlays(view.overlays)
        for route in data.routes {
          let points = route.map(\.location)
          view.addOverlay(MKPolyline(coordinates: points, count: points.count))
        }
      }
      let oldCoordinates = lastData?.points.map { $0.coordinate }
      lastData = data
      if oldCoordinates != data.points.map(\.coordinate) || routesChanged
        || view.region.span.latitudeDelta <= 0
      {
        if !userAdjustedCamera { fit(view) }
      }
    }
    if resetCamera != lastCameraReset {
      lastCameraReset = resetCamera
      userAdjustedCamera = false
      applying = true
      fit(view)
      applying = false
    } else if insetChanged && !userAdjustedCamera { fit(view) }
    if accentChanged {
      for annotation in view.annotations.compactMap({ $0 as? NativeMapAnnotation }) {
        (view.view(for: annotation) as? NativeMapMarkerView)?.configure(
          icon: annotation.icon, accent: lineColor, scale: markerScale(view))
      }
      for overlay in view.overlays {
        if let renderer = view.renderer(for: overlay) as? MKPolylineRenderer {
          renderer.strokeColor = lineColor; renderer.setNeedsDisplay()
        }
      }
    }
    if selected != lastSelection {
      applying = true
      defer { applying = false }
      if let selected,
        let annotation = view.annotations.compactMap({ $0 as? NativeMapAnnotation })
          .first(where: { $0.id == selected })
      {
        view.selectAnnotation(annotation, animated: false)
        reveal(annotation, in: view)
      } else {
        for annotation in view.selectedAnnotations {
          view.deselectAnnotation(annotation, animated: false)
        }
      }
      lastSelection = selected
    }
  }

  private func fit(_ view: MKMapView) {
    guard view.bounds.width > 0, view.bounds.height > 0 else { return }
    var bounds = MKMapRect.null
    for annotation in view.annotations.compactMap({ $0 as? NativeMapAnnotation }) {
      let point = MKMapPoint(annotation.coordinate)
      bounds = bounds.union(MKMapRect(x: point.x, y: point.y, width: 1, height: 1))
    }
    for overlay in view.overlays { bounds = bounds.union(overlay.boundingMapRect) }
    if !bounds.isNull {
      // Fit groups to their actual extent. Giving every point a 500-metre
      // envelope unnecessarily zooms dense groups out until markers overlap.
      // A lone location still needs a useful initial neighbourhood scale.
      if bounds.width <= 1, bounds.height <= 1 {
        let center = MKMapPoint(x: bounds.midX, y: bounds.midY)
        let lat = max(-85, min(85, center.coordinate.latitude))
        let radius = MKMapPointsPerMeterAtLatitude(lat) * 500
        bounds = MKMapRect(x: center.x - radius, y: center.y - radius,
                          width: radius * 2, height: radius * 2)
      }
      // Fit the geographic extent into the unobscured viewport, then express
      // that camera as a full map rect. This keeps card insets separate from
      // MapKit's own edge-padding projection and subsequent layout changes.
      let usable = CGRect(x: 28, y: topInset, width: max(1, view.bounds.width - 28 - trailingInset),
                          height: max(1, view.bounds.height - bottomInset - topInset - 28))
      let scale = max(bounds.width / Double(usable.width), bounds.height / Double(usable.height))
      view.setVisibleMapRect(MKMapRect(
        x: bounds.midX - Double(usable.midX) * scale,
        y: bounds.midY - Double(usable.midY) * scale,
        width: Double(view.bounds.width) * scale,
        height: Double(view.bounds.height) * scale), animated: false)
    }
  }

  func mapView(_ mapView: MKMapView, viewFor annotation: any MKAnnotation) -> MKAnnotationView? {
    guard let point = annotation as? NativeMapAnnotation else { return nil }
    let id = "sdk-map-marker"
    let view =
      (mapView.dequeueReusableAnnotationView(withIdentifier: id) as? NativeMapMarkerView)
      ?? NativeMapMarkerView(annotation: annotation, reuseIdentifier: id)
    view.annotation = annotation
    view.canShowCallout = false
    view.configure(icon: point.icon, accent: lineColor, scale: markerScale(mapView))
    view.displayPriority = .required
    #if os(iOS)
      view.isAccessibilityElement = true
      view.accessibilityLabel = point.title
      view.accessibilityIdentifier = "openui.map.marker." + point.id.displayString
    #else
      view.setAccessibilityLabel(point.title)
      view.setAccessibilityIdentifier("openui.map.marker." + point.id.displayString)
    #endif
    return view
  }

  private func markerScale(_ view: MKMapView) -> CGFloat {
    #if os(iOS)
    view.contentScaleFactor
    #else
    view.window?.backingScaleFactor ?? 1
    #endif
  }

  private func reveal(_ annotation: NativeMapAnnotation, in view: MKMapView) {
    guard view.bounds.height > bottomInset + topInset + 28 else { return }
    let point = view.convert(annotation.coordinate, toPointTo: view)
    let usable = CGRect(x: 28, y: topInset, width: max(1, view.bounds.width - 28 - trailingInset),
                        height: max(1, view.bounds.height - bottomInset - topInset - 28))
    guard !usable.contains(point) else { return }
    let current = view.visibleMapRect
    // Move only far enough to uncover this marker. Recentring a point that is
    // barely outside an edge can unnecessarily pan the other places offscreen.
    let targetX = min(max(point.x, usable.minX), usable.maxX)
    let targetY = min(max(point.y, usable.minY), usable.maxY)
    let deltaX = point.x - targetX
    let deltaY = point.y - targetY
    guard abs(deltaX) > 0.5 || abs(deltaY) > 0.5 else { return }
    let dx = Double(deltaX / view.bounds.width) * current.width
    let dy = Double(deltaY / view.bounds.height) * current.height
    applying = true
    view.setVisibleMapRect(MKMapRect(x: current.minX + dx, y: current.minY + dy,
      width: current.width, height: current.height), animated: false)
    applying = false
  }

  func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
    guard !applying, !userAdjustedCamera,
      let selected = mapView.selectedAnnotations.compactMap({ $0 as? NativeMapAnnotation }).first
    else { return }
    // MapKit can settle its projection after a viewport/card measurement.
    // Keep the selected marker inside the unobscured area once that settles.
    reveal(selected, in: mapView)
  }

  func mapView(_ mapView: MKMapView, regionWillChangeAnimated animated: Bool) {
    guard !applying else { return }
    #if os(iOS)
    func hasGesture(_ view: UIView) -> Bool {
      (view.gestureRecognizers ?? []).contains { $0.state == .began || $0.state == .changed }
        || view.subviews.contains(where: hasGesture)
    }
    if hasGesture(mapView) { userAdjustedCamera = true }
    #else
    if let type = NSApp.currentEvent?.type, [.scrollWheel, .leftMouseDragged, .magnify].contains(type) {
      userAdjustedCamera = true
    }
    #endif
  }

  func mapView(_ mapView: MKMapView, rendererFor overlay: any MKOverlay) -> MKOverlayRenderer {
    if let line = overlay as? MKPolyline {
      let renderer = MKPolylineRenderer(polyline: line)
      renderer.strokeColor = lineColor
      renderer.lineWidth = 4
      return renderer
    }
    return MKOverlayRenderer(overlay: overlay)
  }

  func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
    guard !applying, interactive, let point = view.annotation as? NativeMapAnnotation else {
      return
    }
    guard point.id != lastSelection else { return }
    lastSelection = point.id
    onSelection(point.id)
  }
}

private final class NativeMapAnnotation: NSObject, MKAnnotation {
  let id: OpenUIString
  @objc dynamic var title: String?
  @objc dynamic var coordinate: CLLocationCoordinate2D
  var icon: String?

  init(_ point: NativeMapPoint) {
    id = point.id
    title = point.title
    coordinate = point.coordinate.location
    icon = point.icon
  }
}

/// Compact icon badges own a stable hit target. MapKit's automatic oversized
/// marker expansion is not used, and no score or inferred category is displayed.
private final class NativeMapMarkerView: MKAnnotationView {
  private var symbol = "location.fill"
  private var accent = NativeMapColor.systemBlue
  private var scale: CGFloat = 1
  private struct Drawing: Equatable {
    let symbol: String
    let selected: Bool
    let scale: CGFloat
    let accent: [CGFloat]
    let surface: [CGFloat]
  }
  private var lastDrawing: Drawing?

  func configure(icon: String?, accent: NativeMapColor, scale: CGFloat) {
    symbol = icon ?? "location.fill"; self.accent = accent; self.scale = scale
    redraw()
  }
  override func setSelected(_ selected: Bool, animated: Bool) {
    super.setSelected(selected, animated: animated)
    redraw()
  }
  #if os(iOS)
  override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)
    if traitCollection.hasDifferentColorAppearance(comparedTo: previousTraitCollection) { redraw() }
  }
  #else
  override func viewDidChangeEffectiveAppearance() {
    super.viewDidChangeEffectiveAppearance()
    redraw()
  }
  #endif
  private func redraw() {
    let selected = isSelected
    let size = CGSize(width: 44, height: 52)
    #if os(iOS)
    let surface = NativeMapColor.systemBackground
    #else
    let surface = NativeMapColor.windowBackgroundColor
    #endif
    func components(_ color: NativeMapColor) -> [CGFloat] {
      #if os(iOS)
      var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
      color.resolvedColor(with: traitCollection).getRed(&r, green: &g, blue: &b, alpha: &a)
      return [r,g,b,a]
      #else
      var result: [CGFloat] = []
      effectiveAppearance.performAsCurrentDrawingAppearance {
        if let rgb = color.usingColorSpace(.deviceRGB) { result = [rgb.redComponent,rgb.greenComponent,rgb.blueComponent,rgb.alphaComponent] }
      }
      return result
      #endif
    }
    let drawing = Drawing(symbol: symbol, selected: selected, scale: scale,
      accent: components(accent), surface: components(surface))
    guard drawing != lastDrawing else { return }
    lastDrawing = drawing
    if centerOffset != CGPoint(x: 0, y: -23) { centerOffset = CGPoint(x: 0, y: -23) }
    let outline = CGMutablePath()
    outline.move(to: CGPoint(x: 22, y: 49))
    outline.addLine(to: CGPoint(x: 15.82, y: 41.02))
    outline.addArc(center: CGPoint(x: 22, y: 22), radius: 20,
      startAngle: .pi * 0.6, endAngle: .pi * 0.4, clockwise: false)
    outline.closeSubpath()
    let fill = selected ? accent : surface
    let glyphColor = selected ? surface : accent
    let glyphSymbol = symbol
    func glyphRect(_ size: CGSize) -> CGRect {
      let factor = min(18 / max(1, size.width), 18 / max(1, size.height))
      let extent = CGSize(width: size.width * factor, height: size.height * factor)
      return CGRect(x: (44 - extent.width) / 2, y: (44 - extent.height) / 2,
                    width: extent.width, height: extent.height)
    }
    func background(_ context: CGContext) {
      context.setShadow(offset: CGSize(width: 0, height: 2), blur: 4,
                        color: NativeMapColor.black.withAlphaComponent(0.16).cgColor)
      context.setFillColor(fill.cgColor); context.addPath(outline); context.fillPath()
      context.setShadow(offset: .zero, blur: 0, color: nil)
      context.setStrokeColor(NativeMapColor.white.withAlphaComponent(0.95).cgColor)
      context.setLineWidth(selected ? 2 : 1.5); context.addPath(outline); context.strokePath()
    }
    #if os(iOS)
    let format = UIGraphicsImageRendererFormat(); format.scale = max(1, scale)
    image = UIGraphicsImageRenderer(size: size, format: format).image { drawing in
      background(drawing.cgContext)
      let glyph = UIImage(systemName: glyphSymbol,
        withConfiguration: UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold))
        ?? UIImage(systemName: "location.fill")
      if let glyph { glyph.withTintColor(glyphColor, renderingMode: .alwaysOriginal).draw(in: glyphRect(glyph.size)) }
    }
    layer.zPosition = selected ? 10 : 0
    #else
    image = NSImage(size: size, flipped: false) { _ in
      guard let context = NSGraphicsContext.current?.cgContext else { return false }
      background(context)
      let glyph = NSImage(systemSymbolName: glyphSymbol, accessibilityDescription: nil)
        ?? NSImage(systemSymbolName: "location.fill", accessibilityDescription: nil)
      if let glyph { glyph.withSymbolConfiguration(.init(paletteColors: [glyphColor]))?.draw(in: glyphRect(glyph.size)) }
      return true
    }
    layer?.zPosition = selected ? 10 : 0
    #endif
  }
}
