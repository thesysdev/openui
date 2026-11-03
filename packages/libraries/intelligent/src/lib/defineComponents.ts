import { Badge } from "./Badge";
import { Box } from "./Box";
import { Button } from "./Button";
import { Caption } from "./Caption";
import { Card } from "./Card";
import { Carousel } from "./Carousel";
import { Celebration } from "./Celebration";
import { Chart } from "./Chart";
import { Checkbox } from "./Checkbox";
import { Code } from "./Code";
import { Col } from "./Col";
import { DatePicker } from "./DatePicker";
import { Divider } from "./Divider";
import { Flashcard } from "./Flashcard";
import { Form } from "./Form";
import { Grid } from "./Grid";
import { HtmlView } from "./HtmlView";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { Image } from "./Image";
import { Input } from "./Input";
import { Label } from "./Label";
import { Link } from "./Link";
import { List, ListItem } from "./List";
import { MapMarker, MapView } from "./Map";
import { Markdown } from "./Markdown";
import { MathBlock } from "./Math";
import { Popover } from "./Popover";
import { Pressable } from "./Pressable";
import { Quote } from "./Quote";
import { RadioGroup } from "./RadioGroup";
import { Row } from "./Row";
import { SearchImage } from "./SearchImage";
import { SegmentedControl } from "./SegmentedControl";
import { Select } from "./Select";
import { Slider } from "./Slider";
import { Spacer } from "./Spacer";
import { svgComponents } from "./Svg";
import { Table } from "./Table";
import { Text } from "./Text";
import { TextArea } from "./TextArea";
import { Timer } from "./Timer";
import { Title } from "./Title";
import { YouTube } from "./YouTube";

/**
 * Primitives the model arranges itself, plus a few widgets for what a model
 * cannot draw (a street map, a sandboxed HTML page). Layout is never fixed here.
 * Generic @functions let a page compute with its own state, so an answer can be
 * a working tool rather than a form sent back to the assistant.
 *
 * Importing this runs no createLibrary, so a host can spread it into its own
 * library or take a subset.
 */
export const intelligentComponents = [
  Col,
  Row,
  Box,
  Grid,
  Card,
  Carousel,
  Popover,
  Divider,
  Spacer,
  Title,
  Text,
  Caption,
  Label,
  Badge,
  Link,
  List,
  ListItem,
  Markdown,
  Quote,
  Code,
  MathBlock,
  Button,
  IconButton,
  Pressable,
  Input,
  TextArea,
  Select,
  SegmentedControl,
  Slider,
  Checkbox,
  RadioGroup,
  DatePicker,
  Timer,
  Form,
  SearchImage,
  Image,
  Icon,
  Table,
  Chart,
  MapView,
  MapMarker,
  YouTube,
  Flashcard,
  Celebration,
  ...svgComponents,
  HtmlView,
];
