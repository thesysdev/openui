import { createTheme } from "@openuidev/react-ui";

// A teal accent for this example, with separate values for dark mode so text on the
// accent and the user's message bubble keep their contrast.
export const lightTheme = createTheme({
  interactiveAccentDefault: "#0f766e",
  interactiveAccentHover: "#115e59",
  interactiveAccentPressed: "#134e4a",
  interactiveAccentDisabled: "#99d5cf",
  textAccentPrimary: "#ffffff",
  chatUserResponseBg: "#e3f2ef",
  chatUserResponseText: "#0b3b36",
  radiusM: "10px",
});

export const darkTheme = createTheme({
  interactiveAccentDefault: "#2dd4bf",
  interactiveAccentHover: "#5eead4",
  interactiveAccentPressed: "#14b8a6",
  interactiveAccentDisabled: "#134e4a",
  textAccentPrimary: "#042f2e",
  chatUserResponseBg: "#12332f",
  chatUserResponseText: "#d7f5ef",
  radiusM: "10px",
});
