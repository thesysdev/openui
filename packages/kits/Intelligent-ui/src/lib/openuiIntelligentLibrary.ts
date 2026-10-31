import { createLibrary } from "@openuidev/react-lang";
import { actions } from "./actions";
import { baseComponents } from "./defineComponents";
import { functions } from "./functions";

export const baseComponentGroups = [
    {
      name: "Layout",
      components: ["Col", "Row", "Box", "Grid", "Card", "Carousel", "Popover", "Divider", "Spacer"],
      notes: [
        '- gap and padding count 4px steps. Length is px or a CSS length like "50%". Radius is "sm", "md", "lg", "xl", "full" or px.',
        '- Color is "ink", "muted", "faint", "surface", "info", "success", "warning", "danger", "purple", "pink", "chart1" to "chart6", or a CSS color. As a background, status colors are soft tints.',
      ],
    },
    { name: "Text", components: ["Title", "Text", "Caption", "Label", "Badge", "Link", "List", "ListItem", "Markdown", "Quote", "Code", "Math"] },
    {
      name: "Inputs",
      components: ["Button", "IconButton", "Pressable", "Input", "TextArea", "Select", "SegmentedControl", "Slider", "Checkbox", "RadioGroup", "DatePicker", "Timer", "Form"],
      notes: [
        "- An input's first argument is its value, usually a $variable that other statements read.",
        '- Every input either changes something shown on the page, or sits in a Form whose submit Button sends a short first-person @ToAssistant ("Help me choose a bike"); the form values go with it. No dead inputs.',
        '- In a Form, a field\'s last argument rules is checked before the form sends, and an error shows under the field. Rules is {required?, min?, max?, minLength?, maxLength?, email?, url?, numeric?, pattern?}: Input($email, "Email", "text", null, {required: true, email: true}).',
      ],
    },
    { name: "Media and data", components: ["SearchImage", "Image", "Icon", "Table", "Chart", "Map", "MapMarker", "YouTube"] },
    { name: "Play", components: ["Flashcard", "Celebration"] },
    { name: "Drawing", components: ["Svg", "G", "Circle", "Ellipse", "Rect", "Line", "Path", "Polyline", "Polygon", "SvgText", "HtmlView"] },
];

export const library = createLibrary({
  root: "Col",
  components: baseComponents,
  functions,
  actions,
  componentGroups: baseComponentGroups,
});

// The CLI (npm run prompt) picks up these exports by name.
export { dashboardPromptOptions, promptOptions } from "./prompt-options";
