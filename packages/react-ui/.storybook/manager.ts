import { addons } from "@storybook/manager-api";
import "./manager.css";
import theme from "./theme";

addons.setConfig({
  theme: theme,
});
