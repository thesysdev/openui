const { getDefaultConfig } = require("expo/metro-config");
const os = require("os");

function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}

// Auto-inject the backend URL so you never have to edit .env manually.
// The value in .env (if set) takes priority — useful for pointing at a
// remote server or a different port.
if (!process.env.EXPO_PUBLIC_BACKEND_URL) {
  const ip = getLocalIP();
  process.env.EXPO_PUBLIC_BACKEND_URL = `http://${ip}:3000/api/chat`;
  console.log(`[metro] EXPO_PUBLIC_BACKEND_URL → ${process.env.EXPO_PUBLIC_BACKEND_URL}`);
}

module.exports = getDefaultConfig(__dirname);
