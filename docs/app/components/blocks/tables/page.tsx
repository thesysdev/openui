"use client";

import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@openuidev/react-ui";

function TablePreview() {
  return (
    <Table containerStyle={{ width: 680 }}>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead align="right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell>
            <Tag text="Priority" size="sm" variant="info" styles={{ width: "fit-content" }} />
          </TableCell>
          <TableCell align="right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell>
            <Tag text="Follow up" size="sm" variant="warning" styles={{ width: "fit-content" }} />
          </TableCell>
          <TableCell align="right">$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV003</TableCell>
          <TableCell>Unpaid</TableCell>
          <TableCell>Bank Transfer</TableCell>
          <TableCell>
            <Tag text="Overdue" size="sm" variant="danger" styles={{ width: "fit-content" }} />
          </TableCell>
          <TableCell align="right">$350.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV004</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Apple Pay</TableCell>
          <TableCell>
            <Tag text="Recurring" size="sm" variant="success" styles={{ width: "fit-content" }} />
          </TableCell>
          <TableCell align="right">$89.99</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

export default function BlocksTablesPage() {
  return (
    <PreviewPage>
      <PreviewSection
        title="Tables"
        headingLevel="h1"
        description="Structured data in rows and columns."
      >
        <BlockVariantPreview
          title="Basic"
          description="A basic table with header and body rows."
          preview={<TablePreview />}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
