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
                Text($0.string("text") ?? "").openUIFont($0.theme.typography.body)
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

// MARK: OpenUIWebComponents

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

// MARK: OpenUIMapComponents

/// An opt-in platform component. The pinned upstream collection remains 82 names.
public enum OpenUIMapComponents {
  public static func library(
    id: String? = nil, basemapCoordinateSystem: OpenUIMapCoordinateSystem = .wgs84
  ) throws -> OpenUIComponentLibrary {
    try install(
      into: OpenUIStandardComponents.library(id: id),
      basemapCoordinateSystem: basemapCoordinateSystem)
  }

  public static func install(
    into base: OpenUIComponentLibrary,
    basemapCoordinateSystem: OpenUIMapCoordinateSystem = .wgs84
  ) throws -> OpenUIComponentLibrary {
    let map = OpenUIComponent(
      name: "Map",
      description: """
        Native map for supplied places and route vertices. Never geocode, invent coordinates,
        or connect places when routes are absent. Points have stable id, title, lat and lng;
        optional subtitle, imageSrc, url and icon are factual place metadata. icon is an SF Symbol
        name, never a rating. Each routes entry
        is one actual polyline segment. crs states whether coordinates are wgs84 or gcj02.
        A bound value is the selected point id. size controls map prominence. Optional content
        is an object keyed by point id; each value is an ordinary component or array of components.
        Content appears as horizontally swipeable ordinary components INSIDE the map's bottom
        edge, without pagination chrome. The camera reserves space above this content. Swiping selects
        the corresponding marker; selecting a marker displays its page. Compose each page with
        Card, Stack, ImageText, Buttons etc. When content is omitted, valid supplied points use a
        compact default place card with title and available subtitle/image. No missing facts are
        invented. No coordinates means no point or place card. Routes alone may still render.
        """,
      params: [
        .init(
          name: "points", required: true,
          schema: .object([
            .init(key: "type", value: .string("array")),
            .init(key: "items", value: pointSchema),
          ])),
        .init(
          name: "routes", required: false,
          schema: .object([
            .init(key: "type", value: .string("array")),
            .init(
              key: "items",
              value: .object([
                .init(key: "type", value: .string("array")),
                .init(key: "items", value: coordinateSchema),
              ])),
          ])),
        OpenUIParameter.selection("value", required: false),
        OpenUIParameter.string(
          "size", required: false, values: ["compact", "regular", "expanded"]),
        OpenUIParameter.string("crs", required: false, values: ["wgs84", "gcj02"]),
        .init(name: "content", required: false, schema: .object([
          .init(key: "type", value: .string("object")),
          .init(key: "additionalProperties", value: .object([])),
          .init(key: "description", value: .string("Point id to component/page content. Use the same stable ids as points; each value may be a component or an array.")),
        ])),
      ]
    ) { context in
      NativeMapBlock(context: context, basemapCoordinateSystem: basemapCoordinateSystem)
    }
    // Stack.children accepts any component already. These typed slots require
    // explicit extension through lang-core's existing authoring API.
    return try base.extending(
      adding: [map],
      slots: [
        "Map": base.standardContentSlots
      ])
  }

  private static let coordinateSchema: JSONValue = .object([
    .init(key: "type", value: .string("object")),
    .init(
      key: "properties",
      value: .object([
        .init(key: "lat", value: degreeSchema(min: -90, max: 90)),
        .init(key: "lng", value: degreeSchema(min: -180, max: 180)),
      ])),
    .init(key: "required", value: .array([.string("lat"), .string("lng")])),
    .init(key: "additionalProperties", value: .boolean(false)),
  ])
  private static let pointSchema: JSONValue = .object([
    .init(key: "type", value: .string("object")),
    .init(
      key: "properties",
      value: .object([
        .init(key: "id", value: .object([.init(key: "type", value: .string("string"))])),
        .init(key: "title", value: .object([.init(key: "type", value: .string("string"))])),
        .init(key: "subtitle", value: .object([.init(key: "type", value: .string("string"))])),
        .init(key: "imageSrc", value: .object([.init(key: "type", value: .string("string"))])),
        .init(key: "url", value: .object([.init(key: "type", value: .string("string"))])),
        .init(key: "icon", value: .object([.init(key: "type", value: .string("string"))])),
        .init(key: "lat", value: degreeSchema(min: -90, max: 90)),
        .init(key: "lng", value: degreeSchema(min: -180, max: 180)),
      ])),
    .init(
      key: "required",
      value: .array(
        ["id", "title", "lat", "lng"].map(JSONValue.string))),
    .init(key: "additionalProperties", value: .boolean(false)),
  ])

  private static func degreeSchema(min: Int, max: Int) -> JSONValue {
    .object([
      .init(key: "type", value: .string("number")),
      .init(key: "minimum", value: .number(Double(min))),
      .init(key: "maximum", value: .number(Double(max))),
    ])
  }
}

// MARK: OpenUIPopoverComponents

/// Optional native contextual explanations, without a WebKit dependency.
public enum OpenUIPopoverComponents {
    public static func install(into base: OpenUIComponentLibrary) throws -> OpenUIComponentLibrary {
        let popover = OpenUIComponent(name: "Popover", description: """
            Contextual detail anchored to a compact trigger, such as Icon or short TextContent.
            The SDK makes the trigger an accessible button; do not nest a Button/IconButton inside
            it. content is ordinary component content. Use for optional explanations without adding
            rows to the page; keep essential content visible outside the popover.
            """, params: [OpenUIParameter.slot("trigger", multiple: false, required: true),
                OpenUIParameter.slot("content", multiple: false, required: true), OpenUIParameter.string("label", required: false)]) {
                    NativeContextPopover(context: $0)
                }
        return try base.extending(adding: [popover], slots: [
            "Popover": base.standardContentSlots,
        ])
    }
}

// MARK: OpenUISelectionComponents

enum OpenUISelectionComponents {
    static var components: [OpenUIComponent] {
        [OpenUIReference.component("TabItem") { _ in EmptyView() },
         OpenUIReference.component("Tabs") { NativeTabsView(context: $0) }]
    }
}
