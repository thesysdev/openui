import SwiftUI
#if os(iOS)
import UIKit
#endif

/// Inspection is a deliberate hold on touch platforms. Using the native hold
/// recognizer lets a containing UIScrollView fail the hold when a swipe begins;
/// a zero-distance SwiftUI drag can otherwise capture that swipe immediately.
struct NativeChartInteraction: ViewModifier {
    let inspect: (CGPoint?, Bool) -> Void
    #if !os(iOS)
    @GestureState private var dragging = false
    #endif

    func body(content: Content) -> some View {
        #if os(iOS)
        content.overlay {
            NativeChartTouchInspection(inspect: inspect).accessibilityHidden(true)
        }
        #else
        content.gesture(
            DragGesture(minimumDistance: 0)
                .updating($dragging) { _, active, _ in active = true }
                .onChanged { inspect($0.location, false) }
                .onEnded { _ in inspect(nil, false) }
        )
        .onChange(of: dragging) { active in if !active { inspect(nil, false) } }
        #endif
    }
}

#if os(iOS)
private struct NativeChartTouchInspection: UIViewRepresentable {
    let inspect: (CGPoint?, Bool) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(inspect: inspect) }

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        view.isOpaque = false
        view.isAccessibilityElement = false
        view.accessibilityElementsHidden = true
        let hold = UILongPressGestureRecognizer(target: context.coordinator,
            action: #selector(Coordinator.changed(_:)))
        hold.minimumPressDuration = 0.2
        hold.allowableMovement = 10
        hold.delaysTouchesBegan = false
        hold.delaysTouchesEnded = false
        hold.cancelsTouchesInView = false
        view.addGestureRecognizer(hold)
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.tapped(_:)))
        tap.cancelsTouchesInView = false
        tap.require(toFail: hold)
        view.addGestureRecognizer(tap)
        return view
    }

    func updateUIView(_ view: UIView, context: Context) {
        context.coordinator.inspect = inspect
    }

    final class Coordinator: NSObject {
        var inspect: (CGPoint?, Bool) -> Void
        private var holding = false
        init(inspect: @escaping (CGPoint?, Bool) -> Void) { self.inspect = inspect }

        @objc func tapped(_ tap: UITapGestureRecognizer) {
            if tap.state == .ended { inspect(tap.location(in: tap.view), true) }
        }

        @objc func changed(_ hold: UILongPressGestureRecognizer) {
            switch hold.state {
            case .began:
                holding = true
                inspect(hold.location(in: hold.view), false)
            case .changed where holding: inspect(hold.location(in: hold.view), false)
            case .ended, .cancelled, .failed:
                if holding { holding = false; inspect(nil, false) }
            default: break
            }
        }
    }
}
#endif
