import SwiftUI
import OpenUILang

// Bind existing native views to the unchanged OpenUI component definitions.

// MARK: OpenUIChartComponents

enum OpenUIChartComponents {
  static let chartNames = [
    "BarChart", "LineChart", "AreaChart", "RadarChart", "HorizontalBarChart", "PieChart",
    "RadialChart", "SingleStackedBarChart", "ScatterChart",
  ]
  static var components: [OpenUIComponent] {
    chartNames.map { name in OpenUIReference.component(name) { NativeChart(context: $0) } }
      + ["Series", "Slice", "ScatterSeries", "Point"].map { name in
        OpenUIReference.component(name) { _ in EmptyView() }
      }
  }
}

// MARK: OpenUIContentComponents

/// Native presentation for the pinned standard catalog, without extra DSL names.
enum OpenUIContentComponents {
  static var components: [OpenUIComponent] {
    [
      OpenUIReference.component("CardHeader") { NativeHeading(context: $0, compact: false) },
      OpenUIReference.component("InlineHeader") { NativeHeading(context: $0, compact: true) },
      OpenUIReference.component("MarkDownRenderer") { NativeMarkdown(context: $0) },
      OpenUIReference.component("Callout") { NativeCallout(context: $0, reactive: true) },
      OpenUIReference.component("TextCallout") { NativeCallout(context: $0, reactive: false) },
      OpenUIReference.component("ImageBlock") { NativeImageBlock(context: $0) },
      OpenUIReference.component("ImageGallery") { NativeImageGallery(context: $0) },
      OpenUIReference.component("Text") { NativeInlineText(context: $0, bold: false) },
      OpenUIReference.component("BoldText") { NativeInlineText(context: $0, bold: true) },
      OpenUIReference.component("IconText") {
        NativeMediaText(context: $0, media: .icon)
      },
      OpenUIReference.component("ImageText") {
        NativeMediaText(context: $0, media: .thumbnail)
      },
      OpenUIReference.component("ImageTextLarge") {
        NativeMediaText(context: $0, media: .banner)
      },
      OpenUIReference.component("Icon") { NativeIcon(context: $0) },
      OpenUIReference.component("IconButton") { NativeIconButton(context: $0) },
      OpenUIReference.component("Tag") { NativeTag(context: $0) },
      OpenUIReference.component("TagBlock") { NativeTagBlock(context: $0) },
      OpenUIReference.component("EntityList") { NativeEntityList(context: $0) },
      OpenUIReference.component("ListBlock") { NativeListBlock(context: $0) },
      OpenUIReference.component("ListItem") { NativeListItem(context: $0) },
      OpenUIReference.component("Steps") { NativeSteps(context: $0) },
      OpenUIReference.component("StepsItem") { _ in EmptyView() },
      OpenUIReference.component("Carousel") { NativeCarousel(context: $0) },
      OpenUIReference.component("Modal") { NativeModal(context: $0) },
    ]
      + ["Snippet", "Overview", "Context", "Composite", "Visual"].flatMap { kind in
        [
          OpenUIReference.component(kind + "CardItem") { NativeCardItem(context: $0, kind: kind) },
          OpenUIReference.component(kind + "CardBlock") {
            NativeCardBlock(context: $0, kind: kind)
          },
        ]
      }
  }
}

// MARK: OpenUIDisplayComponents

enum OpenUIDisplayComponents {
    static var components: [OpenUIComponent] {
        return [
            OpenUIReference.component("Label") {
                Text($0.string("text") ?? "").openUIFont($0.theme.textBodyDefault)
            },
            OpenUIReference.component("Separator") { context in NativeSeparator(context: context) },
            OpenUIReference.component("CodeBlock") { NativeCodeBlock(context: $0) },
            OpenUIReference.component("Col") { _ in EmptyView() },
            OpenUIReference.component("Table") { NativeDataTable(context: $0) },
            OpenUIReference.component("EditableTable") { NativeEditableTable(context: $0) },
            OpenUIReference.component("AccordionItem") { _ in EmptyView() },
            OpenUIReference.component("Accordion") { NativeAccordion(context: $0) },
            OpenUIReference.component("MetricIndicatorWithStrikethrough") {
                NativeMetric(context: $0, inline: false)
            },
            OpenUIReference.component("MetricIndicatorInline") {
                NativeMetric(context: $0, inline: true)
            },
        ]
    }
}

// MARK: OpenUIFormComponents

enum OpenUIFormComponents {
    static let fieldNames = ["Input", "TextArea", "Select", "CheckBoxGroup", "RadioGroup", "SwitchGroup", "DatePicker", "Slider"]
    static var components: [OpenUIComponent] {
        [
            OpenUIReference.component("Form") { OpenUINativeForm(context: $0) },
            OpenUIReference.component("FormControl") { OpenUINativeFormControl(context: $0) },
            OpenUIReference.component("Buttons") { OpenUINativeButtons(context: $0) },
            OpenUIReference.component("Input") { OpenUINativeField(context: $0, kind: .input) },
            OpenUIReference.component("TextArea") { OpenUINativeField(context: $0, kind: .textArea) },
            OpenUIReference.component("Select") { OpenUINativeField(context: $0, kind: .select) },
            OpenUIReference.component("RadioGroup") { OpenUINativeField(context: $0, kind: .radio) },
            OpenUIReference.component("CheckBoxGroup") { OpenUINativeField(context: $0, kind: .checkbox) },
            OpenUIReference.component("SwitchGroup") { OpenUINativeField(context: $0, kind: .switches) },
            OpenUIReference.component("Slider") { OpenUINativeField(context: $0, kind: .slider) },
            OpenUIReference.component("DatePicker") { OpenUINativeField(context: $0, kind: .date) },
            OpenUIReference.component("Chips") { OpenUINativeField(context: $0, kind: .chips) },
            OpenUIReference.component("OptionCards") { OpenUINativeField(context: $0, kind: .optionCards) },
            OpenUIReference.component("SelectItem") { _ in EmptyView() },
            OpenUIReference.component("RadioItem") { _ in EmptyView() },
            OpenUIReference.component("CheckBoxItem") { _ in EmptyView() },
            OpenUIReference.component("SwitchItem") { _ in EmptyView() },
            OpenUIReference.component("ChipItem") { _ in EmptyView() },
            OpenUIReference.component("OptionCard") { _ in EmptyView() }
        ]
    }
}

// MARK: OpenUISelectionComponents

enum OpenUISelectionComponents {
    static var components: [OpenUIComponent] {
        [OpenUIReference.component("TabItem") { _ in EmptyView() },
         OpenUIReference.component("Tabs") { NativeTabsView(context: $0) }]
    }
}
