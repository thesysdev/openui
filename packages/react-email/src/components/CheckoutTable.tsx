"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Button, Column, Heading, Img, Row, Section, Text } from "@react-email/components";
import { z } from "zod";
import { EmailCheckoutItem } from "./CheckoutItem";

export const EmailCheckoutTable = defineComponent({
  name: "EmailCheckoutTable",
  props: z.object({
    title: z.string().optional(),
    items: z.array(EmailCheckoutItem.ref),
    buttonLabel: z.string(),
    buttonHref: z.string(),
    buttonColor: z.string().optional(),
  }),
  description:
    "Checkout/cart table with product items (image, name, quantity, price) and a checkout button. Great for abandoned cart and order summary emails.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];
    const bg = (props.buttonColor as string) ?? "#4F46E5";
    const title = (props.title as string) ?? "You left something in your cart";

    return (
      <Section style={{ paddingTop: 16, paddingBottom: 16, textAlign: "center" }}>
        <Heading
          as="h1"
          style={{
            fontSize: 30,
            lineHeight: "36px",
            marginBottom: "0px",
            fontWeight: 600,
          }}
        >
          {title}
        </Heading>
        <div
          style={{
            padding: 16,
            paddingTop: "0px",
            marginTop: 16,
            marginBottom: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#E5E7EB",
          }}
        >
          <table style={{ marginBottom: 16 }} width="100%">
            <thead>
              <tr>
                <th
                  style={{
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderWidth: "0px",
                    borderBottomWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#E5E7EB",
                  }}
                >
                  &nbsp;
                </th>
                <th
                  align="left"
                  colSpan={6}
                  style={{
                    paddingTop: 8,
                    paddingBottom: 8,
                    color: "#6B7280",
                    borderWidth: "0px",
                    borderBottomWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#E5E7EB",
                  }}
                >
                  <Text style={{ fontWeight: 600 }}>Product</Text>
                </th>
                <th
                  align="center"
                  style={{
                    paddingTop: 8,
                    paddingBottom: 8,
                    color: "#6B7280",
                    borderWidth: "0px",
                    borderBottomWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#E5E7EB",
                  }}
                >
                  <Text style={{ fontWeight: 600 }}>Qty</Text>
                </th>
                <th
                  align="center"
                  style={{
                    paddingTop: 8,
                    paddingBottom: 8,
                    color: "#6B7280",
                    borderWidth: "0px",
                    borderBottomWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#E5E7EB",
                  }}
                >
                  <Text style={{ fontWeight: 600 }}>Price</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td
                    style={{
                      paddingTop: 8,
                      paddingBottom: 8,
                      borderWidth: "0px",
                      borderBottomWidth: 1,
                      borderStyle: "solid",
                      borderColor: "#E5E7EB",
                    }}
                  >
                    {item?.props?.imageSrc ? (
                      <Img
                        alt={String(item?.props?.imageAlt ?? item?.props?.name ?? "")}
                        height={110}
                        src={String(item?.props?.imageSrc)}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                      />
                    ) : null}
                  </td>
                  <td
                    align="left"
                    colSpan={6}
                    style={{
                      paddingTop: 8,
                      paddingBottom: 8,
                      borderWidth: "0px",
                      borderBottomWidth: 1,
                      borderStyle: "solid",
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <Text>{String(item?.props?.name ?? "")}</Text>
                  </td>
                  <td
                    align="center"
                    style={{
                      paddingTop: 8,
                      paddingBottom: 8,
                      borderWidth: "0px",
                      borderBottomWidth: 1,
                      borderStyle: "solid",
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <Text>{String(item?.props?.quantity ?? 1)}</Text>
                  </td>
                  <td
                    align="center"
                    style={{
                      paddingTop: 8,
                      paddingBottom: 8,
                      borderWidth: "0px",
                      borderBottomWidth: 1,
                      borderStyle: "solid",
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <Text>{String(item?.props?.price ?? "")}</Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Row>
            <Column align="center">
              <Button
                href={props.buttonHref as string}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  paddingLeft: 12,
                  paddingRight: 12,
                  borderRadius: 8,
                  textAlign: "center",
                  backgroundColor: bg,
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                {props.buttonLabel as string}
              </Button>
            </Column>
          </Row>
        </div>
      </Section>
    );
  },
});
