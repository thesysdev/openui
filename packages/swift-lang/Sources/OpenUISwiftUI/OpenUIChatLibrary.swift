import OpenUILang
import SwiftUI

/// The OpenUI chat library rendered with native SwiftUI views. Component names
/// and arguments match `openuiChatLibrary` from @openuidev/react-ui (see
/// `ChatComponents`), and the root is `Card`.
public enum OpenUIChatLibrary {
  @MainActor
  public static let library = SwiftUILibrary(
    components: ChatComponents.all.map { schema in
      SwiftUIComponent(schema, content: views[schema.name] ?? { _ in AnyView(EmptyView()) })
    },
    root: "Card",
    componentGroups: ChatComponents.groups)

  /// Sub-components that only carry data for their parent (a chart reads its
  /// `Series`); they render nothing on their own.
  static let dataOnly: Set<String> = ["Series", "ScatterSeries", "Point", "Slice"]

  @MainActor
  static let views: [String: ComponentContent] = {
    func make<V: View>(_ view: @escaping @MainActor (ComponentProps) -> V) -> ComponentContent {
      { AnyView(view($0)) }
    }
    return [
      // Content
      "Card": make(CardView.init),
      "CardHeader": make(CardHeaderView.init),
      "TextContent": make(TextContentView.init),
      "MarkDownRenderer": make(MarkDownRendererView.init),
      "Callout": make(CalloutView.init),
      "TextCallout": make(TextCalloutView.init),
      "CodeBlock": make(CodeBlockView.init),
      "Image": make(ImageView.init),
      "ImageBlock": make(ImageBlockView.init),
      "ImageGallery": make(ImageGalleryView.init),
      "Separator": make(SeparatorView.init),
      "InlineHeader": make(InlineHeaderView.init),
      // Tables
      "Table": make(TableView.init),
      "Col": make(ColView.init),
      "EditableTable": make(EditableTableView.init),
      // Charts
      "BarChart": make(BarChartView.init),
      "LineChart": make(LineChartView.init),
      "AreaChart": make(AreaChartView.init),
      "RadarChart": make(RadarChartView.init),
      "HorizontalBarChart": make(HorizontalBarChartView.init),
      "PieChart": make(PieChartView.init),
      "RadialChart": make(RadialChartView.init),
      "SingleStackedBarChart": make(SingleStackedBarChartView.init),
      "ScatterChart": make(ScatterChartView.init),
      // Forms
      "Form": make(FormView.init),
      "FormControl": make(FormControlView.init),
      "Label": make(LabelView.init),
      "Input": make(InputView.init),
      "TextArea": make(TextAreaView.init),
      "Select": make(SelectView.init),
      "SelectItem": make(SelectItemView.init),
      "DatePicker": make(DatePickerView.init),
      "Slider": make(SliderView.init),
      "CheckBoxGroup": make(CheckBoxGroupView.init),
      "CheckBoxItem": make(CheckBoxItemView.init),
      "RadioGroup": make(RadioGroupView.init),
      "RadioItem": make(RadioItemView.init),
      "SwitchGroup": make(SwitchGroupView.init),
      "SwitchItem": make(SwitchItemView.init),
      "Chips": make(ChipsView.init),
      "ChipItem": make(ChipItemView.init),
      "OptionCards": make(OptionCardsView.init),
      "OptionCard": make(OptionCardView.init),
      // Buttons and icons
      "Button": make(ButtonView.init),
      "Buttons": make(ButtonsView.init),
      "Icon": make(IconView.init),
      "IconButton": make(IconButtonView.init),
      // Lists and layout
      "ListBlock": make(ListBlockView.init),
      "ListItem": make(ListItemView.init),
      "FollowUpBlock": make(FollowUpBlockView.init),
      "FollowUpItem": make(FollowUpItemView.init),
      "SectionBlock": make(SectionBlockView.init),
      "SectionItem": make(TriggeredContentView.init),
      "Tabs": make(TabsView.init),
      "TabItem": make(TriggeredContentView.init),
      "Accordion": make(AccordionView.init),
      "AccordionItem": make(TriggeredContentView.init),
      "Steps": make(StepsView.init),
      "StepsItem": make(StepsItemView.init),
      "Carousel": make(CarouselView.init),
      // Data display
      "TagBlock": make(TagBlockView.init),
      "Tag": make(TagView.init),
      "EntityList": make(EntityListView.init),
      // Cards and their building blocks
      "SnippetCardBlock": make(SnippetCardBlockView.init),
      "SnippetCardItem": make(SnippetCardItemView.init),
      "OverviewCardBlock": make(OverviewCardBlockView.init),
      "OverviewCardItem": make(OverviewCardItemView.init),
      "ContextCardBlock": make(ContextCardBlockView.init),
      "ContextCardItem": make(ContextCardItemView.init),
      "CompositeCardBlock": make(CompositeCardBlockView.init),
      "CompositeCardItem": make(CompositeCardItemView.init),
      "VisualCardBlock": make(VisualCardBlockView.init),
      "VisualCardItem": make(VisualCardItemView.init),
      "Text": make { TextLineView(props: $0, bold: false) },
      "BoldText": make { TextLineView(props: $0, bold: true) },
      "IconText": make(IconTextView.init),
      "ImageText": make(ImageTextView.init),
      "ImageTextLarge": make(ImageTextLargeView.init),
      "MetricIndicatorInline": make(MetricIndicatorInlineView.init),
      "MetricIndicatorWithStrikethrough": make(MetricIndicatorWithStrikethroughView.init),
    ]
  }()
}
