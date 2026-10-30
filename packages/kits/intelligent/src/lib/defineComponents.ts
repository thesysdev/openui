// Stylesheets in cascade order. Order matters where two sheets style one
// element at the same specificity: tokens first, Button before
// SegmentedControl (segments retune its tokens), markdownBlocks before
// Markdown (the prose rhythm sets the margins), and shared last (its spacing
// wins). src/index.ts imports the same list; the build checks both against
// the sheets on disk.
import "../shared/theme.css";
import "./Badge/badge.css";
import "../components/Button/button.css";
import "./IconButton/iconButton.css";
import "../components/Pressable/pressable.css";
import "../components/SegmentedControl/segmentedControl.css";
import "../components/Slider/slider.css";
import "../components/Timer/timer.css";
import "../components/Checkbox/checkbox.css";
import "../components/RadioGroup/radioGroup.css";
import "../components/Photo/photo.css";
import "../components/HtmlView/htmlView.css";
import "../components/Carousel/carousel.css";
import "../components/Popover/popover.css";
import "../components/Flashcard/flashcard.css";
import "../components/Celebration/celebration.css";
import "../components/Map/map.css";
import "../shared/shared.css";
import { Chart } from "./Chart";
import { Carousel } from "./Carousel";
import { Celebration } from "./Celebration";
import { Flashcard } from "./Flashcard";
import { MathBlock } from "./Math";
import { Popover } from "./Popover";
import { Quote } from "./Quote";
import { YouTube } from "./YouTube";
import { Code } from "./Code";
import { Pressable } from "./Pressable";
import { Slider } from "./Slider";
import { Timer } from "./Timer";
import { SegmentedControl } from "./SegmentedControl";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { Input } from "./Input";
import { TextArea } from "./TextArea";
import { Select } from "./Select";
import { Checkbox } from "./Checkbox";
import { DatePicker } from "./DatePicker";
import { RadioGroup } from "./RadioGroup";
import { HtmlView } from "./HtmlView";
import { Box } from "./Box";
import { Card } from "./Card";
import { Col } from "./Col";
import { Grid } from "./Grid";
import { Row } from "./Row";
import { Spacer } from "./Spacer";
import { Form } from "./Form";
import { Divider } from "./Divider";
import { MapMarker } from "./Map";
import { MapView } from "./Map";
import { Icon } from "./Icon";
import { Image } from "./Image";
import { SearchImage } from "./SearchImage";
import { svgComponents } from "./Svg";
import { Table } from "./Table";
import { Caption } from "./Caption";
import { Link } from "./Link";
import { Text } from "./Text";
import { Title } from "./Title";
import { List } from "./List";
import { ListItem } from "./List";
import { Badge } from "./Badge";
import { Label } from "./Label";
import { Markdown } from "./Markdown";

/**
 * Primitives the model arranges itself, plus a few widgets for what a model
 * cannot draw (a street map, a sandboxed HTML page). Layout is never fixed here.
 * Generic @functions let a page compute with its own state, so an answer can be
 * a working tool rather than a form sent back to the assistant.
 *
 * Importing this runs no createLibrary, so a host can spread it into its own
 * library or take a subset. The stylesheets come with it for the same reason.
 */
export const baseComponents = [
    Col, Row, Box, Grid, Card, Carousel, Popover, Divider, Spacer,
    Title, Text, Caption, Label, Badge, Link, List, ListItem, Markdown, Quote, Code, MathBlock,
    Button, IconButton, Pressable, Input, TextArea, Select, SegmentedControl, Slider, Checkbox, RadioGroup, DatePicker, Timer, Form,
    SearchImage, Image, Icon, Table, Chart, MapView, MapMarker, YouTube,
    Flashcard, Celebration,
    ...svgComponents, HtmlView,
];
