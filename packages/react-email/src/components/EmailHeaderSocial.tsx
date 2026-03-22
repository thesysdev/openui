"use client";

import { Column, Img, Link, Row, Section } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailSocialIcon } from "./EmailSocialIcon";

export const EmailHeaderSocial = defineComponent({
  name: "EmailHeaderSocial",
  props: z.object({
    logoSrc: z.string(),
    logoAlt: z.string(),
    logoHeight: z.number().optional(),
    icons: z.array(EmailSocialIcon.ref),
  }),
  description:
    "Header with logo on the left and social media icon links on the right. Uses EmailSocialIcon items.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = (props.icons ?? []) as any[];
    const logoHeight = (props.logoHeight as number) ?? 42;

    return (
      <Section style={{ padding: "32px" }}>
        <Row>
          <Column style={{ width: "80%" }}>
            <Img
              alt={props.logoAlt as string}
              width="42"
              height={logoHeight.toString()}
              src={props.logoSrc as string}
              style={{ display: "block" }}
            />
          </Column>
          <Column align="right">
            <Row align="right">
              {icons.map((icon, i) => (
                <Column key={i}>
                  <Link href={String(icon?.props?.href ?? "#")}>
                    <Img
                      alt={String(icon?.props?.alt ?? "")}
                      src={String(icon?.props?.src ?? "")}
                      width="36"
                      height="36"
                      style={{ marginLeft: "4px", marginRight: "4px" }}
                    />
                  </Link>
                </Column>
              ))}
            </Row>
          </Column>
        </Row>
      </Section>
    );
  },
});
