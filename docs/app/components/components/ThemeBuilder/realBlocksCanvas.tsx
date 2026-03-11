"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Buttons,
  CheckBoxGroup,
  CheckBoxItem,
  DatePicker,
  IconButton,
  ImageBlock,
  Input,
  RadioGroup,
  RadioItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SwitchGroup,
  SwitchItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  Tag,
  TextCallout,
} from "@openuidev/react-ui";
import dynamic from "next/dynamic";
import { useState } from "react";
import styles from "./realBlocksCanvas.module.css";

const ChartsSection = dynamic(() => import("./ChartsSection"), { ssr: false });

const PREVIEW_IMAGE =
  "https://images.unsplash.com/photo-1738168246881-40f35f8aba0a?w=900&auto=format&fit=crop&q=60";

function Block({ title: _title, children }: { title: string; children: React.ReactNode }) {
  return <article className={styles.block}>{children}</article>;
}

export default function RealBlocksCanvas() {
  const [city, setCity] = useState("paris");

  return (
    <div className={styles.canvas}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Navigation</h2>
        <Block title="Tabs">
          <div className={styles.inlineStack}>
            <Tabs defaultValue="paris">
              <TabsList variant="title">
                <TabsTrigger value="paris" text="Paris" />
                <TabsTrigger value="tokyo" text="Tokyo" />
                <TabsTrigger value="new-york" text="New York" />
              </TabsList>
            </Tabs>
            <Tabs defaultValue="insights">
              <TabsList variant="iconTitleSubtext">
                <TabsTrigger
                  value="insights"
                  text="Insights"
                  icon={<span>📊</span>}
                  subtext="KPIs"
                />
                <TabsTrigger value="revenue" text="Revenue" icon={<span>💰</span>} subtext="MRR" />
                <TabsTrigger value="users" text="Users" icon={<span>👥</span>} subtext="MAU" />
              </TabsList>
            </Tabs>
          </div>
        </Block>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Individual Blocks</h2>
        <Block title="Accordion">
          <Accordion type="single" collapsible variant="clear" defaultValue="item-1">
            <AccordionItem value="item-1">
              <AccordionTrigger text="What is OpenUI UI?" />
              <AccordionContent>
                OpenUI UI is a design system for polished interfaces.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger text="Can I customise the theme?" />
              <AccordionContent>
                Yes, theme tokens are applied through ThemeProvider variables.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Block>
        <Block title="Buttons">
          <div className={styles.buttonRow}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <IconButton
              icon={
                <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <path
                    d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              variant="tertiary"
              aria-label="Download"
            />
          </div>
          <Buttons variant="horizontal" style={{ width: "fit-content" }}>
            <Button variant="primary">Save</Button>
            <Button variant="secondary">Cancel</Button>
          </Buttons>
        </Block>
        <Block title="Callout">
          <TextCallout
            variant="info"
            title="Heads up"
            description="This callout updates with your current theme settings."
          />
        </Block>
        <Block title="Image">
          <ImageBlock src={PREVIEW_IMAGE} alt="Scenic landscape preview" />
        </Block>
        <Block title="Tables">
          <div className={styles.tableWrap}>
            <Table containerStyle={{ width: 680 }}>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>INV001</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell align="right">$250.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>INV002</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell align="right">$150.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Block>
        <Block title="Text items">
          <div className={styles.inlineStack}>
            <TextCallout
              title="Text item title"
              description="Supporting description for text item."
            />
            <TextCallout title="3.7%" description="Conversion rate" variant="success" />
          </div>
        </Block>
        <Block title="Tag item">
          <div className={styles.tagRow}>
            <Tag text="Design" variant="info" />
            <Tag text="Docs" variant="neutral" />
            <Tag text="Released" variant="success" />
          </div>
        </Block>
      </section>

      <ChartsSection />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Forms</h2>
        <Block title="Checkbox group">
          <CheckBoxGroup variant="card">
            <CheckBoxItem
              value="email"
              label="Email notifications"
              description="Receive updates by email"
            />
            <CheckBoxItem
              value="slack"
              label="Slack alerts"
              description="Receive updates in Slack"
            />
          </CheckBoxGroup>
        </Block>
        <Block title="Date picker">
          <DatePicker mode="single" style={{ width: "100%" }} />
        </Block>
        <Block title="Input field">
          <div className={styles.inputWrap}>
            <Input size="medium" placeholder="Enter text..." />
          </div>
        </Block>
        <Block title="Toggle group">
          <SwitchGroup variant="card">
            <SwitchItem value="left" label="Left align" description="Align content to the left" />
            <SwitchItem
              value="center"
              label="Center align"
              description="Align content to the center"
            />
          </SwitchGroup>
        </Block>
        <Block title="Radio button group">
          <RadioGroup variant="card">
            <RadioItem value="starter" label="Starter" description="For personal use" />
            <RadioItem value="pro" label="Pro" description="For growing teams" />
          </RadioGroup>
        </Block>
        <Block title="Select">
          <div className={styles.selectWrap}>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger size="md">
                <SelectValue placeholder="Choose city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paris">Paris</SelectItem>
                <SelectItem value="tokyo">Tokyo</SelectItem>
                <SelectItem value="new-york">New York</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Block>
      </section>
    </div>
  );
}
