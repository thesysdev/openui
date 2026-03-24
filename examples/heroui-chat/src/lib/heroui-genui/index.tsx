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

export const herouiFormExamples: string[] = [
  `Example 1 — Simple contact form:
root = Form("contact", "Contact Us", btns, [fc1, fc2, fc3])
fc1 = FormControl("Name", input1)
fc2 = FormControl("Email", input2, "We'll never share your email.")
fc3 = FormControl("Message", ta1)
input1 = Input("name", "Your name", "text", { required: true })
input2 = Input("email", "you@example.com", "email", { required: true, email: true })
ta1 = TextArea("message", "How can we help?", 4)
btns = Buttons([b1])
b1 = Button("Submit", { type: "continue_conversation" }, "primary")`,

  `Example 2 — Registration form with select and checkbox:
root = Form("register", "Create Account", btns, [fc1, fc2, fc3, fc4, fc5])
fc1 = FormControl("First Name", input1)
fc2 = FormControl("Last Name", input2)
fc3 = FormControl("Email", input3)
fc4 = FormControl("Country", sel1)
fc5 = FormControl("I agree to the terms", cb1)
input1 = Input("firstName", "Jane", "text", { required: true })
input2 = Input("lastName", "Doe", "text", { required: true })
input3 = Input("email", "jane@example.com", "email", { required: true, email: true })
sel1 = Select("country", [si1, si2, si3])
si1 = SelectItem("us", "United States")
si2 = SelectItem("gb", "United Kingdom")
si3 = SelectItem("ca", "Canada")
cb1 = CheckBoxGroup("terms", [cbi1])
cbi1 = CheckBoxItem("agree", "I agree to the terms and conditions", { required: true })
btns = Buttons([b1, b2])
b1 = Button("Create Account", { type: "continue_conversation" }, "primary")
b2 = Button("Cancel", { type: "continue_conversation" }, "secondary")`,

  `Example 3 — Shipping address form using FormRow for paired fields:
root = Form("shipping", "Shipping Address", btns, [row1, fc3, row2, fc6])
row1 = FormRow([fc1, fc2])
fc1 = FormControl("First Name", input1)
fc2 = FormControl("Last Name", input2)
fc3 = FormControl("Street Address", input3)
row2 = FormRow([fc4, fc5])
fc4 = FormControl("City", input4)
fc5 = FormControl("ZIP Code", input5)
fc6 = FormControl("Country", sel1)
input1 = Input("firstName", "Jane", "text", { required: true })
input2 = Input("lastName", "Doe", "text", { required: true })
input3 = Input("address", "123 Main St", "text", { required: true })
input4 = Input("city", "New York", "text", { required: true })
input5 = Input("zip", "10001", "text", { required: true })
sel1 = Select("country", [si1, si2, si3])
si1 = SelectItem("us", "United States")
si2 = SelectItem("gb", "United Kingdom")
si3 = SelectItem("ca", "Canada")
btns = Buttons([b1])
b1 = Button("Save Address", { type: "continue_conversation" }, "primary")`,
];

export const herouiFormAdditionalRules: string[] = [
  "Every response is a single Form(...) — Form is the root element.",
  "Form takes: name (identifier), title (heading text), optional description (subheading), buttons reference, fields array.",
  "Always include explicit Buttons with at least one primary submit button.",
  "Define EACH FormControl as its own reference — do NOT inline all controls in one array. This allows progressive field-by-field streaming.",
  "Use FormRow to place 2–3 short fields side-by-side on the same row (e.g. First Name / Last Name, City / State / ZIP). Pass an array of FormControl refs to FormRow.",
  "NEVER nest Form inside Form — each Form should be a standalone container.",
  "Choose appropriate input types: Input for text/email/password/number, TextArea for long text, Select for dropdown choices, CheckBoxGroup for multi-select, RadioGroup for single-select, SwitchGroup for toggles, Slider for ranges, NumberField for numeric input.",
  "If prior assistant turns are present in the conversation, the latest user message is a refinement request: output one full updated Form that applies those changes while preserving unrelated fields.",
  "If the user message includes a JSON snapshot labeled 'Current form values', preserve those values in placeholder or default attributes where sensible.",
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
