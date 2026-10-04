import { InjectionToken } from "@angular/core";
import type { OpenUiContextValue } from "./context";

export const OPENUI_CONTEXT = new InjectionToken<OpenUiContextValue>("OPENUI_CONTEXT");
export const OPENUI_FORM_NAME = new InjectionToken<string | undefined>("OPENUI_FORM_NAME");
