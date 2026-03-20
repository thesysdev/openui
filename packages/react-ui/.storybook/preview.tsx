import type { Preview } from "@storybook/react";
import { themes } from "@storybook/theming";
import "../src/components/index.scss";
import { ThemeProvider } from "../src/components/ThemeProvider";
import "./preflight.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true,
    },
    docs: {
      theme: themes.dark,
    },
  },
  initialGlobals: {
    backgrounds: {
      value: "#F7F9F2",
    },
  },
  globalTypes: {
    mode: {
      name: "Mode",
      description: "Global mode for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          {
            value: "light",
            icon: "sun",
            title: "Light",
          },
          {
            value: "dark",
            icon: "moon",
            title: "Dark",
          },
        ],
        dynamicTitle: true,
      },
    },
    // theme: {
    //   description: "Global theme for components",
    //   defaultValue: "",
    //   // toolbar: {
    //   //   title: "Theme",
    //   //   icon: "paintbrush",
    //   //   // items: [
    //   //   //   ...Object.keys(themePresets).map((theme) => ({
    //   //   //     value: `production-${theme}`,
    //   //   //     title: `${theme} (production)`,
    //   //   //     icon: "paintbrush",
    //   //   //   })),
    //   //   //   ...Object.keys(experimentalThemePresets).map((theme) => ({
    //   //   //     value: `experimental-${theme}`,
    //   //   //     title: `${theme} (experimental)`,
    //   //   //     icon: "beaker",
    //   //   //   })),
    //   //   // ],
    //   //   dynamicTitle: true,
    //   //   defaultValue: "",
    //   // },
    // },
  },
  decorators: [
    (Story, context) => {
      // Use the selected theme from toolbar
      const selectedMode = context.globals.mode;
      // const selectedTheme = context.globals.theme;

      // let selectedThemePreset;

      // if (selectedTheme) {
      //   // Parse theme selection (production-themeName or experimental-themeName)
      //   if (selectedTheme.startsWith("production-")) {
      //     const themeName = selectedTheme.replace("production-", "");
      //     selectedThemePreset = themePresets[themeName];
      //   } else if (selectedTheme.startsWith("experimental-")) {
      //     const themeName = selectedTheme.replace("experimental-", "");
      //     selectedThemePreset = experimentalThemePresets[themeName];
      //   }
      // }

      return (
        <>
          <style>
            {`
            .docs-story {
              background-color: ${selectedMode === "dark" ? "#333" : "#F7F9F2"};
            }
          `}
          </style>
          {/* {selectedThemePreset ? ( */}
          {/* <ThemeProvider
              mode={selectedMode}
              theme={selectedThemePreset.theme}
              darkTheme={selectedThemePreset.darkTheme}
            >
              <Story />
            </ThemeProvider> */}

          <ThemeProvider mode={selectedMode}>
            <Story />
          </ThemeProvider>
        </>
      );
    },
  ],
};

export default preview;
