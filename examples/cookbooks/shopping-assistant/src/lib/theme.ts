import { createTheme } from "@openuidev/react-ui";

// A violet accent for this example, with separate values for dark mode so text on the accent
// and the user's message bubble keep their contrast.
export const lightTheme = createTheme({
  interactiveAccentDefault: "#5b3fd1",
  interactiveAccentHover: "#4b31b5",
  interactiveAccentPressed: "#3d2896",
  interactiveAccentDisabled: "#c9bff2",
  textAccentPrimary: "#ffffff",
  chatUserResponseBg: "#eeeafc",
  chatUserResponseText: "#23145e",
  radiusM: "12px",
});

export const darkTheme = createTheme({
  interactiveAccentDefault: "#a996ff",
  interactiveAccentHover: "#bfb0ff",
  interactiveAccentPressed: "#8f78f5",
  interactiveAccentDisabled: "#3a2d73",
  textAccentPrimary: "#170c45",
  chatUserResponseBg: "#261d4d",
  chatUserResponseText: "#e6e0ff",
  radiusM: "12px",
});
