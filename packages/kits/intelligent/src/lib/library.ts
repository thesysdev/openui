import { createLibrary } from "@openuidev/react-lang";
import { actions } from "./actions";
import { functions } from "./functions";
// Stylesheets in cascade order. Order matters where two sheets style one
// element at the same specificity: tokens first, Button before
// SegmentedControl (segments retune its tokens), markdownBlocks before
// Markdown (the prose rhythm sets the margins), and shared last (its spacing
// wins). src/index.ts imports the same list; the build checks both against
// the sheets on disk.
import "./components/theme.css";
import "./components/Col/col.css";
import "./components/Row/row.css";
import "./components/Grid/grid.css";
import "./components/Spacer/spacer.css";
import "./components/Card/card.css";
import "./components/Form/form.css";
import "./components/Title/title.css";
import "./components/Text/text.css";
import "./components/Caption/caption.css";
import "./components/controlHelpers.css";
import "./components/Link/link.css";
import "./components/Badge/badge.css";
import "./components/Icon/icon.css";
import "./components/List/list.css";
import "./components/markdownBlocks.css";
import "./components/Markdown/markdown.css";
import "./components/Button/button.css";
import "./components/IconButton/iconButton.css";
import "./components/Pressable/pressable.css";
import "./components/SegmentedControl/segmentedControl.css";
import "./components/Slider/slider.css";
import "./components/Timer/timer.css";
import "./components/Checkbox/checkbox.css";
import "./components/RadioGroup/radioGroup.css";
import "./components/photo.css";
import "./components/Svg/svg.css";
import "./components/HtmlView/htmlView.css";
import "./components/Carousel/carousel.css";
import "./components/Popover/popover.css";
import "./components/Quote/quote.css";
import "./components/Math/math.css";
import "./components/YouTube/youTube.css";
import "./components/Flashcard/flashcard.css";
import "./components/Celebration/celebration.css";
import "./components/Map/map.css";
import "./components/shared.css";
import { Chart } from "./components/Chart";
import { Carousel } from "./components/Carousel";
import { Celebration } from "./components/Celebration";
import { Flashcard } from "./components/Flashcard";
import { MathBlock } from "./components/Math";
import { Popover } from "./components/Popover";
import { Quote } from "./components/Quote";
import { YouTube } from "./components/YouTube";
import { Code } from "./components/Code";
import { Pressable } from "./components/Pressable";
import { Slider } from "./components/Slider";
import { Timer } from "./components/Timer";
import { SegmentedControl } from "./components/SegmentedControl";
import { Button } from "./components/Button";
import { IconButton } from "./components/IconButton";
import { Input } from "./components/Input";
import { TextArea } from "./components/TextArea";
import { Select } from "./components/Select";
import { Checkbox } from "./components/Checkbox";
import { DatePicker } from "./components/DatePicker";
import { RadioGroup } from "./components/RadioGroup";
import { HtmlView } from "./components/HtmlView";
import { Box } from "./components/Box";
import { Card } from "./components/Card";
import { Col } from "./components/Col";
import { Grid } from "./components/Grid";
import { Row } from "./components/Row";
import { Spacer } from "./components/Spacer";
import { Form } from "./components/Form";
import { Divider } from "./components/Divider";
import { MapMarker } from "./components/Map";
import { MapView } from "./components/Map";
import { Icon } from "./components/Icon";
import { Image } from "./components/Image";
import { SearchImage } from "./components/SearchImage";
import { svgComponents } from "./components/Svg";
import { Table } from "./components/Table";
import { Caption } from "./components/Caption";
import { Link } from "./components/Link";
import { Text } from "./components/Text";
import { Title } from "./components/Title";
import { List } from "./components/List";
import { ListItem } from "./components/List";
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
