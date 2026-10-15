import { Renderer } from "@openuidev/react-lang";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { openuiLibrary } from "../..";

/**
 * Form is a genui-lib (openui-lang) component with no standalone React
 * counterpart, so these stories render openui-lang programs through the
 * Renderer with the openuiLibrary — the same path an LLM response takes.
 */
const OpenUIProgram = ({ response }: { response: string }) => (
  <Renderer
    response={response}
    library={openuiLibrary}
    onAction={(event) => console.log("onAction:", event)}
    onStateUpdate={(state) => console.log("onStateUpdate:", state)}
  />
);

const meta: Meta<typeof OpenUIProgram> = {
  title: "GenUI/Form",
  component: OpenUIProgram,
  tags: ["!dev", "autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The openui-lang `Form(name, buttons, fields)` container. It wires field-level validation rules to its FormControls and validates them when a primary Button fires an action.\n\n```tsx\nimport { Renderer } from '@openuidev/react-lang';\nimport { openuiLibrary } from '@openuidev/react-ui';\n```",
      },
    },
  },
  argTypes: {
    response: {
      control: "text",
      description: "openui-lang source code rendered through the openuiLibrary",
      table: { category: "Content", type: { summary: "string" } },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "480px", margin: "2rem" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OpenUIProgram>;

const contactForm = `root = Stack([title, form])
title = Text("Contact Us", "h2")
form = Form("contact", btns, [nameField, emailField, countryField, msgField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }), "We never share your email.")
countryField = FormControl("Country", Select("country", countryOpts, "Select a country...", { required: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
countryOpts = [SelectItem("us", "United States"), SelectItem("uk", "United Kingdom"), SelectItem("de", "Germany")]
btns = Buttons([Button("Submit", @ToAssistant("Submit"), "primary"), Button("Cancel", @ToAssistant("Cancel"), "secondary")])`;

export const Default: Story = {
  args: { response: contactForm },
};

/**
 * Primary buttons validate the enclosing Form before firing their action.
 * This story submits the empty form so the per-field error hints are visible.
 */
export const ValidationErrors: Story = {
  args: { response: contactForm },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submit = await canvas.findByRole("button", { name: "Submit" });
    await userEvent.click(submit);
  },
};

const preferencesForm = `root = Form("preferences", btns, [dateField, budgetField, interestsField, planField])
dateField = FormControl("Travel date", DatePicker("date", "single", { required: true }))
budgetField = FormControl("Budget", Slider("budget", "continuous", 0, 5000, 100, [1500], "USD"))
interestsField = FormControl("Interests", CheckBoxGroup("interests", [beaches, culture, food]))
beaches = CheckBoxItem("Beaches", "Sun, sand, and sea", "beaches")
culture = CheckBoxItem("Culture", "Museums and historic sites", "culture")
food = CheckBoxItem("Food", "Local cuisine and restaurants", "food")
planField = FormControl("Plan", RadioGroup("plan", [basic, premium]))
basic = RadioItem("Basic", "Self-guided itinerary", "basic")
premium = RadioItem("Premium", "Includes a personal guide", "premium")
btns = Buttons([Button("Save preferences", @ToAssistant("Save preferences"), "primary")])`;

/** Form accepts every FormControl input type, not just text fields. */
export const AllControlTypes: Story = {
  args: { response: preferencesForm },
};
