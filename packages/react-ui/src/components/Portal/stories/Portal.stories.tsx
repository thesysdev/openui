import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Portal } from "../Portal";

const meta: Meta<typeof Portal> = {
  title: "Components/Portal",
  component: Portal,
  tags: ["!autodocs", "dev"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Renders a React subtree in a different part of the DOM.\n\n```tsx\nimport { Portal } from '@openuidev/react-ui';\n```",
      },
    },
  },
  argTypes: {
    container: {
      control: false,
      description:
        "An optional container element where the portaled content should be appended. Defaults to `document.body`.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Portal>;

export const Default: Story = {
  render: () => (
    <div>
      <p>Content before the portal.</p>
      <Portal>
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            padding: "12px 20px",
            background: "#18181b",
            color: "#fff",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          I am rendered via a Portal (check the DOM — this is in document.body)
        </div>
      </Portal>
    </div>
  ),
};

export const CustomContainer: Story = {
  render: () => {
    const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

    return (
      <div>
        <p>The portaled content appears in the blue box below:</p>
        <div
          ref={setContainer}
          style={{
            marginTop: 12,
            padding: 16,
            border: "2px dashed #3b82f6",
            borderRadius: 8,
            minHeight: 60,
          }}
        />
        {container && (
          <Portal container={container}>
            <span style={{ color: "#3b82f6", fontWeight: 500 }}>
              Portaled into a custom container! <br />
              this is inside Portal component
            </span>
          </Portal>
        )}
      </div>
    );
  },
};
