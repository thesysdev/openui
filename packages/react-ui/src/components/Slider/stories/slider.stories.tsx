import type { Meta, StoryObj } from "@storybook/react";
import { SliderBlock, SliderBlockProps } from "../SliderBlock";

const meta: Meta<SliderBlockProps> = {
  title: "Components/Slider",
  component: SliderBlock,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A slider component with a label, inline value editing (text input for continuous, select dropdown for discrete), range support, and validation.\n\n```tsx\nimport { SliderBlock } from '@openui-ui/react-ui';\n```",
      },
    },
  },
  tags: ["!dev", "autodocs"],

  argTypes: {
    label: {
      control: "text",
      description: "Label displayed above the slider",
      table: {
        category: "Content",
        type: { summary: "string" },
        required: true,
      },
    },
    variant: {
      control: "radio",
      options: ["continuous", "discrete"],
      description:
        "Continuous shows a text input for value editing. Discrete shows a select dropdown with stepped options.",
      table: {
        category: "Appearance",
        type: { summary: "'continuous' | 'discrete'" },
        required: true,
      },
    },
    min: {
      control: "number",
      description: "Minimum value of the slider",
      table: {
        category: "Value",
        type: { summary: "number" },
        defaultValue: { summary: "0" },
      },
    },
    max: {
      control: "number",
      description: "Maximum value of the slider",
      table: {
        category: "Value",
        type: { summary: "number" },
        defaultValue: { summary: "100" },
      },
    },
    step: {
      control: "number",
      description: "Step increment. For discrete variant, defaults to 1 if not provided.",
      table: {
        category: "Value",
        type: { summary: "number" },
      },
    },
    defaultValue: {
      control: false,
      description:
        "Initial value(s). Pass a single-element array for single slider, two-element array for range.",
      table: {
        category: "Value",
        type: { summary: "number[]" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the slider is disabled",
      table: {
        category: "State",
        type: { summary: "boolean" },
      },
    },
    name: {
      control: "text",
      description: "Form field name",
      table: {
        category: "Form",
        type: { summary: "string" },
      },
    },
  },

  decorators: [
    (Story) => (
      <div style={{ width: "400px", padding: "2rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SliderBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ContinuousSingle: Story = {
  args: {
    label: "Brightness",
    variant: "continuous",
    min: 0,
    max: 100,
    defaultValue: [50],
  },
  parameters: {
    docs: {
      description: {
        story:
          "A continuous single-value slider with a text input for precise value entry. Validates that the input is within the min/max range.",
      },
    },
  },
};

export const ContinuousRange: Story = {
  args: {
    label: "Price Range",
    variant: "continuous",
    min: 0,
    max: 1000,
    defaultValue: [200, 800],
  },
  parameters: {
    docs: {
      description: {
        story:
          "A continuous range slider with two text inputs for min and max values. Shows validation errors for out-of-range or invalid values.",
      },
    },
  },
};

export const DiscreteSingle: Story = {
  args: {
    label: "Team Size",
    variant: "discrete",
    min: 1,
    max: 10,
    step: 1,
    defaultValue: [5],
  },
  parameters: {
    docs: {
      description: {
        story:
          "A discrete single-value slider with a select dropdown showing all valid step values.",
      },
    },
  },
};

export const DiscreteRange: Story = {
  args: {
    label: "Experience (years)",
    variant: "discrete",
    min: 0,
    max: 20,
    step: 2,
    defaultValue: [4, 14],
  },
  parameters: {
    docs: {
      description: {
        story:
          "A discrete range slider with two select dropdowns. Each dropdown filters out values that would create an invalid range.",
      },
    },
  },
};

export const CustomStep: Story = {
  args: {
    label: "Volume",
    variant: "discrete",
    min: 0,
    max: 100,
    step: 25,
    defaultValue: [50],
  },
  parameters: {
    docs: {
      description: {
        story:
          "A discrete slider with a custom step of 25, creating options at 0, 25, 50, 75, 100.",
      },
    },
  },
};

export const LargeRange: Story = {
  args: {
    label: "Salary Range ($K)",
    variant: "continuous",
    min: 0,
    max: 500,
    defaultValue: [80, 250],
  },
  parameters: {
    docs: {
      description: {
        story: "A continuous range slider demonstrating larger value ranges with text inputs.",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    label: "Locked Setting",
    variant: "continuous",
    min: 0,
    max: 100,
    defaultValue: [75],
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "A disabled slider block. The slider track and thumb are non-interactive.",
      },
    },
  },
};
