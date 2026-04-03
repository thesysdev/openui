"use client";

import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import { createLibrary } from "@openuidev/react-lang";

import { Button } from "./components/button";
import { Buttons } from "./components/buttons";
import { CheckBoxGroup, CheckBoxItem } from "./components/checkbox-group";
import { Form } from "./components/form";
import { FormControl } from "./components/form-control";
import { FormRow } from "./components/form-row";
import { Input } from "./components/input";
import { NumberField } from "./components/number-field";
import { RadioGroup, RadioItem } from "./components/radio-group";
import { Select, SelectItem } from "./components/select";
import { Slider } from "./components/slider";
import { SwitchGroup, SwitchItem } from "./components/switch-group";
import { TextArea } from "./components/textarea";

// ── Component Groups ──

export const herouiComponentGroups: ComponentGroup[] = [
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
  {
    name: "Forms",
    components: [
      "Form",
      "FormRow",
      "FormControl",
      "Input",
      "TextArea",
      "Select",
      "SelectItem",
      "NumberField",
      "Slider",
      "CheckBoxGroup",
      "CheckBoxItem",
      "RadioGroup",
      "RadioItem",
      "SwitchGroup",
      "SwitchItem",
    ],
  },
];

// ── Form Generator Prompt Options ──

export const herouiFormExamples: string[] = [];

export const herouiFormAdditionalRules: string[] = [
  "Every response is a single Form(...) — Form is the root element.",
  "Always include explicit Buttons with at least one primary submit button.",
  "Define EACH FormControl as its own reference — do NOT inline all controls in one array. This allows progressive field-by-field streaming.",
  "Use FormRow to place 2-3 short fields side-by-side on the same row (e.g. First Name / Last Name, City / State / ZIP). Pass an array of FormControl refs to FormRow.",
  "NEVER nest Form inside Form — each Form should be a standalone container.",
  "Choose appropriate input types: Input for text/email/password/number, TextArea for long text, Select for dropdown choices, CheckBoxGroup for multi-select, RadioGroup for single-select, SwitchGroup for toggles, Slider for ranges, NumberField for numeric input.",
  "If prior assistant turns are present in the conversation, the latest user message is a refinement request: output one full updated Form that applies those changes while preserving unrelated fields.",
];

export const herouiFormPromptOptions: PromptOptions = {
  examples: herouiFormExamples,
  additionalRules: herouiFormAdditionalRules,
};

// ── Library ──

export const herouiChatLibrary = createLibrary({
  root: "Form",
  componentGroups: herouiComponentGroups,
  components: [
    Form,
    FormRow,
    FormControl,
    Button,
    Buttons,
    Input,
    TextArea,
    Select,
    SelectItem,
    NumberField,
    Slider,
    CheckBoxGroup,
    CheckBoxItem,
    RadioGroup,
    RadioItem,
    SwitchGroup,
    SwitchItem,
  ],
});
