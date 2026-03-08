"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import { CheckBoxGroup, CheckBoxItem } from "@openuidev/react-ui";

function CheckboxGroupPreview() {
  return (
    <CheckBoxGroup variant="card">
      <CheckBoxItem
        value="email"
        label="Email notifications"
        description="Receive updates by email"
      />
      <CheckBoxItem value="slack" label="Slack alerts" description="Receive updates in Slack" />
      <CheckBoxItem value="sms" label="SMS alerts" description="Receive urgent updates by SMS" />
    </CheckBoxGroup>
  );
}

export default function BlocksCheckboxGroupPage() {
  return (
    <BlocksDocPage
      title="Checkbox group"
      description="Preview for the Checkbox group block."
      preview={<CheckboxGroupPreview />}
    />
  );
}
