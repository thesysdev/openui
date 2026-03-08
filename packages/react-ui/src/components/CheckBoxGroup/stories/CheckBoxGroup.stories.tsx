import type { Meta, StoryObj } from "@storybook/react";
import { CheckBoxItem } from "../../CheckBoxItem";
import { CheckBoxGroup } from "../CheckBoxGroup";

const meta = {
  title: "Components/CheckBoxGroup",
  component: CheckBoxGroup,
  subcomponents: { CheckBoxItem } as any,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { CheckBoxGroup, CheckBoxItem } from '@openuidev/react-ui';\n```",
      },
    },
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["clear", "card", "sunk"],
      description: "The visual style variant of the checkbox group",
      table: {
        category: "Appearance",
        type: {
          summary: "'clear' | 'card' | 'sunk'",
        },
        defaultValue: { summary: "clear" },
      },
    },
    children: {
      control: false,
      description: "The child elements of the checkbox group that accept CheckBoxItem components",
      table: {
        category: "Content",
        type: {
          summary: "ReactNode[] | ReactNode",
        },
        expanded: false,
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: {
          summary: "string",
        },
        expanded: false,
      },
    },
    style: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: {
          summary: "CSSProperties",
        },
        expanded: false,
      },
    },
  },
  tags: ["!dev", "autodocs"],
} satisfies Meta<typeof CheckBoxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClearVariant: Story = {
  args: {
    variant: "card",
    children: [
      <CheckBoxItem key="1" label="Option 1" description="This is a description" />,
      <CheckBoxItem key="2" label="Option 2" description="This is a description" />,
      <CheckBoxItem key="3" label="Option 3" description="This is a description" />,
    ],
  },
};

export const WithLongDescription: Story = {
  args: {
    variant: "card",
    children: [
      <CheckBoxItem
        key="long1"
        label="First option with a long description"
        description="This is a long description that elaborates on the choice in great detail so that readers can fully understand the implications of selecting this option. It provides context, examples, and any caveats that might be relevant when making a selection."
      />,
      <CheckBoxItem
        key="long2"
        label="Second option with a long description"
        description="Another extended description that spans multiple sentences to showcase how the component behaves with verbose content. It should wrap correctly and remain readable without breaking the layout of the checkbox group."
      />,
      <CheckBoxItem
        key="long3"
        label="Third option with a long description"
        description="A very long explanation that includes more nuance about the option, possible trade-offs, and guidance for when this might be preferred. This helps validate the design for accessibility and usability with real-world copy lengths."
      />,
    ],
  },
};
