import { createTheme } from "@openuidev/react-ui";

// A terracotta accent for this example, with separate values for dark mode so text on the
// accent and the user's message bubble keep their contrast.
export const lightTheme = createTheme({
  interactiveAccentDefault: "#b4441f",
  interactiveAccentHover: "#9a3818",
  interactiveAccentPressed: "#7f2e14",
  interactiveAccentDisabled: "#ebb9a5",
  textAccentPrimary: "#ffffff",
  chatUserResponseBg: "#f8e8e0",
  chatUserResponseText: "#4a1c0c",
  radiusM: "12px",
});

export const darkTheme = createTheme({
  interactiveAccentDefault: "#f0875f",
  interactiveAccentHover: "#f5a283",
  interactiveAccentPressed: "#e56e41",
  interactiveAccentDisabled: "#5c2a17",
  textAccentPrimary: "#2a0f05",
  chatUserResponseBg: "#3a1f15",
  chatUserResponseText: "#fbe3d8",
  radiusM: "12px",
});
