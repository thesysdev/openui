import { Renderer } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import React from "react";
import { createRoot } from "react-dom/client";

// Public surface consumed by CDN/iframe hosts. Treat this shape as a stable
// contract; changes here are breaking for downstream embedders.
window.__OpenUI = { React, createRoot, Renderer, openuiChatLibrary };
