import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, User } from "lucide-react";
import { Avatar } from "../../Avatar";
import { ListItem } from "../../ListItem";
import { ListBlock } from "../ListBlock";

const meta: Meta<typeof ListBlock> = {
  title: "Components/ListBlock",
  component: ListBlock,
  subcomponents: {
    ListItem: ListItem as any,
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ListBlock, ListItem } from '@openuidev/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["number", "plain"],
      description: "Controls the indicator type for every ListItem in the list.",
      table: { category: "Appearance", defaultValue: { summary: "number" } },
    },
    children: { control: false, table: { category: "Content" } },
    className: { control: false, table: { category: "Appearance" } },
    style: { control: false, table: { category: "Appearance" } },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof ListBlock>;

export const NumberWithSubtitle: Story = {
  render: () => (
    <ListBlock variant="number">
      <ListItem
        title="Set up your workspace"
        subtitle="Install dependencies and configure your environment"
      />
      <ListItem title="Create your first component" subtitle="Build a reusable UI element" />
      <ListItem title="Publish to production" subtitle="Deploy and share your work" />
    </ListBlock>
  ),
};

export const NumberNoSubtitle: Story = {
  render: () => (
    <ListBlock variant="number">
      <ListItem title="Set up your workspace" />
      <ListItem title="Create your first component" />
      <ListItem title="Publish to production" />
    </ListBlock>
  ),
};

export const NumberClickable: Story = {
  render: () => (
    <ListBlock variant="number">
      <ListItem
        title="Set up your workspace"
        subtitle="Install dependencies and configure your environment"
        actionLabel="Start"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Step 1")}
      />
      <ListItem
        title="Create your first component"
        subtitle="Build a reusable UI element"
        actionLabel="Start"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Step 2")}
      />
      <ListItem
        title="Publish to production"
        subtitle="Deploy and share your work"
        actionLabel="Start"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Step 3")}
      />
    </ListBlock>
  ),
};

export const IconWithSubtitle: Story = {
  render: () => (
    <ListBlock variant="plain">
      <ListItem
        leading={<Avatar name="User" icon={<User />} />}
        title="John Doe"
        subtitle="Software Engineer"
      />
      <ListItem
        leading={<Avatar name="User" icon={<User />} />}
        title="Jane Smith"
        subtitle="Product Designer"
      />
      <ListItem
        leading={<Avatar name="User" icon={<User />} />}
        title="Ankit Das"
        subtitle="Software Developer"
      />
    </ListBlock>
  ),
};

export const IconNoSubtitle: Story = {
  render: () => (
    <ListBlock variant="plain">
      <ListItem leading={<Avatar name="User" icon={<User />} />} title="John Doe" />
      <ListItem leading={<Avatar name="User" icon={<User />} />} title="Jane Smith" />
      <ListItem leading={<Avatar name="User" icon={<User />} />} title="Ankit Das" />
    </ListBlock>
  ),
};

export const IconClickable: Story = {
  render: () => (
    <ListBlock variant="plain">
      <ListItem
        leading={<Avatar name="User" icon={<User />} />}
        title="John Doe"
        subtitle="Software Engineer"
        actionLabel="View Profile"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("John Doe")}
      />
      <ListItem
        leading={<Avatar name="User" icon={<User />} />}
        title="Jane Smith"
        subtitle="Product Designer"
        actionLabel="View Profile"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Jane Smith")}
      />
      <ListItem
        leading={<Avatar name="User" icon={<User />} />}
        title="Ankit Das"
        subtitle="Software Developer"
        actionLabel="View Profile"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Ankit Das")}
      />
    </ListBlock>
  ),
};

export const ImageWithSubtitle: Story = {
  render: () => (
    <ListBlock variant="plain">
      <ListItem
        leading={<Avatar name="John" src="https://i.pravatar.cc/40?img=1" icon={<User />} />}
        title="John Doe"
        subtitle="Software Engineer"
      />
      <ListItem
        leading={<Avatar name="Jane" src="https://i.pravatar.cc/40?img=2" icon={<User />} />}
        title="Jane Smith"
        subtitle="Product Designer"
      />
      <ListItem
        leading={<Avatar name="Ankit" src="https://i.pravatar.cc/40?img=3" icon={<User />} />}
        title="Ankit Das"
        subtitle="Software Developer"
      />
    </ListBlock>
  ),
};

export const ImageNoSubtitle: Story = {
  render: () => (
    <ListBlock variant="plain">
      <ListItem
        leading={<Avatar name="John" src="https://i.pravatar.cc/40?img=1" icon={<User />} />}
        title="John Doe"
      />
      <ListItem
        leading={<Avatar name="Jane" src="https://i.pravatar.cc/40?img=2" icon={<User />} />}
        title="Jane Smith"
      />
      <ListItem
        leading={<Avatar name="Ankit" src="https://i.pravatar.cc/40?img=3" icon={<User />} />}
        title="Ankit Das"
      />
    </ListBlock>
  ),
};

export const ImageClickable: Story = {
  render: () => (
    <ListBlock variant="plain">
      <ListItem
        leading={<Avatar name="John" src="https://i.pravatar.cc/40?img=1" icon={<User />} />}
        title="John Doe"
        subtitle="Software Engineer"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("John Doe")}
      />
      <ListItem
        leading={<Avatar name="Jane" src="https://i.pravatar.cc/40?img=2" icon={<User />} />}
        title="Jane Smith"
        subtitle="Product Designer"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Jane Smith")}
      />
      <ListItem
        leading={<Avatar name="Ankit" src="https://i.pravatar.cc/40?img=3" icon={<User />} />}
        title="Ankit Das"
        subtitle="Software Developer"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Ankit Das")}
      />
    </ListBlock>
  ),
};
