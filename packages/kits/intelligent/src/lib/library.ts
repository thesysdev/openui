import { createLibrary } from "@openuidev/react-lang";
import { actions } from "./actions";
import { functions } from "./functions";
import "./components/theme.css";
import "./components/components.css";
import "./components/map/map.css";
import { Chart } from "./components/Chart";
import { Carousel } from "./components/Carousel";
import { Celebration, Flashcard, MathBlock, Popover, Quote, YouTube } from "./components/extra";
import { Code } from "./components/Code";
import { Button, Pressable, SegmentedControl, Slider, Timer } from "./components/controls";
import { IconButton } from "./components/IconButton";
import { Input } from "./components/Input";
import { TextArea } from "./components/TextArea";
import { Select } from "./components/Select";
import { Checkbox } from "./components/Checkbox";
import { DatePicker } from "./components/DatePicker";
import { RadioGroup } from "./components/RadioGroup";
import { HtmlView } from "./components/html-view";
import { Box, Card, Col, Form, Grid, Row, Spacer } from "./components/layout";
import { Divider } from "./components/Divider";
import { MapMarker, MapView } from "./components/map/map";
import { Icon, Image, SearchImage } from "./components/media";
import { svgComponents } from "./components/svg";
import { Table } from "./components/Table";
import { Caption, Link, List, ListItem, Text, Title } from "./components/text";
import { Badge } from "./components/Badge";
import { Label } from "./components/Label";
import { Markdown } from "./components/Markdown";

/**
 * Primitives the model arranges itself, plus a few widgets for what a model
 * cannot draw (a street map, a sandboxed HTML page). Layout is never fixed here.
 * Generic @functions let a page compute with its own state, so an answer can be
 * a working tool rather than a form sent back to the assistant.
 */
export const baseComponents = [
    Col, Row, Box, Grid, Card, Carousel, Popover, Divider, Spacer,
    Title, Text, Caption, Label, Badge, Link, List, ListItem, Markdown, Quote, Code, MathBlock,
    Button, IconButton, Pressable, Input, TextArea, Select, SegmentedControl, Slider, Checkbox, RadioGroup, DatePicker, Timer, Form,
    SearchImage, Image, Icon, Table, Chart, MapView, MapMarker, YouTube,
    Flashcard, Celebration,
    ...svgComponents, HtmlView,
];

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
