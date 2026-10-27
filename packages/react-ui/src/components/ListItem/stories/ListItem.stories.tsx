import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, User } from "lucide-react";
import { Avatar } from "../../Avatar";
import { ListItem } from "../ListItem";

const meta: Meta<typeof ListItem> = {
  title: "Components/ListItem",
  component: ListItem,
  tags: ["!dev", "!autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ListItem } from '@openuidev/react-ui';\n```",
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
      table: { category: "Appearance", defaultValue: { summary: "number" } },
    },
    title: { control: "text", table: { category: "Content" } },
    subtitle: { control: "text", table: { category: "Content" } },
    leading: { control: false, table: { category: "Content" } },
    index: { control: "number", table: { category: "Behavior" } },
    listHasSubtitle: { control: "boolean", table: { category: "Behavior" } },
    actionLabel: { control: "text", table: { category: "Content" } },
    actionIcon: { control: false, table: { category: "Content" } },
    onClick: { control: false, table: { category: "Behavior" } },
  },
};

export default meta;
type Story = StoryObj<typeof ListItem>;

export const Number: Story = {
  args: {
    variant: "number",
    index: 0,
    listHasSubtitle: true,
    title: "Numbered List Item",
    subtitle: "The indicator shows index + 1",
  },
};

export const NumberClickable: Story = {
  args: {
    variant: "number",
    index: 0,
    listHasSubtitle: true,
    title: "Clickable Numbered Item",
    subtitle: "Click me to trigger an action",
    actionLabel: "Start",
    actionIcon: <ChevronRight size={16} />,
    onClick: () => alert("Clicked!"),
  },
};

export const Icon: Story = {
  args: {
    variant: "plain",
    leading: <Avatar name="User" icon={<User />} />,
    listHasSubtitle: true,
    title: "Icon List Item",
    subtitle: "The indicator shows an icon",
  },
};

export const IconClickable: Story = {
  args: {
    variant: "plain",
    leading: <Avatar name="User" icon={<User />} />,
    listHasSubtitle: true,
    title: "Clickable Icon Item",
    subtitle: "Click me to trigger an action",
    actionLabel: "View",
    actionIcon: <ChevronRight size={16} />,
    onClick: () => alert("Clicked!"),
  },
};

export const Image: Story = {
  args: {
    variant: "plain",
    leading: <Avatar name="Avatar" src="https://i.pravatar.cc/40" icon={<User />} />,
    listHasSubtitle: true,
    title: "Image List Item",
    subtitle: "The indicator shows a thumbnail",
  },
};

export const ImageClickable: Story = {
  args: {
    variant: "plain",
    leading: <Avatar name="Avatar" src="https://i.pravatar.cc/40" icon={<User />} />,
    listHasSubtitle: true,
    title: "Clickable Image Item",
    subtitle: "Click me to trigger an action",
    actionIcon: <ChevronRight size={16} />,
    onClick: () => alert("Clicked!"),
  },
};
