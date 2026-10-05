import React from "react";
import ChatScreen from "./screens/ChatScreen";
import ErrorScreen from "./screens/ErrorScreen";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function App() {
  if (!BACKEND_URL) {
    return (
      <ErrorScreen
        title="Backend not configured"
        message="EXPO_PUBLIC_BACKEND_URL is not set. The app cannot connect to the chat API."
        hint={
          "Create a .env file in the project root:\n\n" +
          "EXPO_PUBLIC_BACKEND_URL=http://<your-ip>:3000/api/chat\n\n" +
          "Then restart the Expo dev server."
        }
      />
    );
  }

  return <ChatScreen backendUrl={BACKEND_URL} />;
}
