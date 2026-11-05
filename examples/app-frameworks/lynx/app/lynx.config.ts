import { networkInterfaces } from "node:os";

import { pluginLynxConfig } from "@lynx-js/config-rsbuild-plugin";
import { pluginQRCode } from "@lynx-js/qrcode-rsbuild-plugin";
import { pluginReactLynx } from "@lynx-js/react-rsbuild-plugin";
import { defineConfig } from "@lynx-js/rspeedy";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";

/**
 * The backend runs on the development machine. A phone resolves `localhost` to
 * itself, so compile the machine's LAN address into the bundle instead.
 */
function findLanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) return address.address;
    }
  }

  return "127.0.0.1";
}

const apiUrl = process.env.OPENUI_API_URL?.trim() || `http://${findLanAddress()}:3001/api/chat`;

export default defineConfig({
  plugins: [
    pluginQRCode(),
    pluginReactLynx({
      defaultDisplayLinear: false,
    }),
    pluginTypeCheck(),
    pluginLynxConfig({
      enableCSSInlineVariables: true,
    }),
  ],
  source: {
    define: {
      __DEFAULT_OPENUI_API_URL__: JSON.stringify(apiUrl),
    },
    entry: {
      main: "./src/index.tsx",
    },
  },
  environments: {
    web: {
      source: {
        define: {
          __IS_WEB__: true,
        },
      },
    },
    lynx: {
      source: {
        define: {
          __IS_WEB__: false,
        },
      },
    },
  },
  server: {
    port: 8080,
  },
  output: {
    filename: "[name].[platform].bundle",
  },
});
