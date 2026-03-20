"use server";

import {
  Body,
  Button,
  CodeBlock,
  CodeInline,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Markdown,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

type PrismLanguage = Parameters<typeof CodeBlock>[0]["language"];

interface ElementNode {
  typeName: string;
  props: Record<string, unknown>;
}

function buildElement(node: ElementNode): ReactElement | null {
  switch (node.typeName) {
    case "EmailHeading": {
      const level = Math.min(Math.max((node.props.level as number) ?? 1, 1), 6);
      const tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return (
        <Heading
          as={tag}
          style={{
            color: "#1a1a1a",
            margin: "0 0 12px 0",
            fontSize: level === 1 ? "28px" : level === 2 ? "22px" : "18px",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {node.props.text as string}
        </Heading>
      );
    }
    case "EmailText":
      return (
        <Text
          style={{
            color: "#374151",
            fontSize: "16px",
            lineHeight: "24px",
            margin: "0 0 16px 0",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {node.props.text as string}
        </Text>
      );
    case "EmailButton": {
      const bg = (node.props.backgroundColor as string) ?? "#5F51E8";
      return (
        <Button
          href={node.props.href as string}
          style={{
            backgroundColor: bg,
            color: "#ffffff",
            borderRadius: "6px",
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "bold",
            textDecoration: "none",
            textAlign: "center" as const,
            display: "inline-block",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {node.props.label as string}
        </Button>
      );
    }
    case "EmailImage":
      return (
        <Img
          src={node.props.src as string}
          alt={node.props.alt as string}
          width={((node.props.width as number) ?? 600).toString()}
          style={{
            maxWidth: "100%",
            height: "auto",
            margin: "0 0 16px 0",
            borderRadius: "4px",
          }}
        />
      );
    case "EmailDivider":
      return <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />;
    case "EmailLink":
      return (
        <Link
          href={node.props.href as string}
          style={{
            color: "#5F51E8",
            textDecoration: "underline",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {node.props.text as string}
        </Link>
      );
    case "EmailSection": {
      const children = (node.props.children as ElementNode[]) ?? [];
      return (
        <Section style={{ margin: "0 0 24px 0" }}>
          {children.map((child, i) => {
            const el = buildElement(child);
            return el ? <span key={i}>{el}</span> : null;
          })}
        </Section>
      );
    }
    case "EmailColumn": {
      const children = (node.props.children as ElementNode[]) ?? [];
      return (
        <Column style={{ verticalAlign: "top" }}>
          {children.map((child, i) => {
            const el = buildElement(child);
            return el ? <span key={i}>{el}</span> : null;
          })}
        </Column>
      );
    }
    case "EmailColumns": {
      const children = (node.props.children as ElementNode[]) ?? [];
      return (
        <Row style={{ margin: "0 0 16px 0" }}>
          {children.map((child, i) => {
            const el = buildElement(child);
            return el ? <span key={i}>{el}</span> : null;
          })}
        </Row>
      );
    }
    case "EmailCodeBlock": {
      const lang = ((node.props.language as string) ?? "javascript") as PrismLanguage;
      return (
        <CodeBlock
          code={node.props.code as string}
          language={lang}
          theme={{
            base: {
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              padding: "16px",
              borderRadius: "6px",
              fontSize: "14px",
              lineHeight: "1.5",
              overflow: "auto",
              margin: "0 0 16px 0",
              fontFamily: "'Fira Code', 'Courier New', monospace",
            },
          }}
        />
      );
    }
    case "EmailCodeInline":
      return (
        <CodeInline
          style={{
            backgroundColor: "#f3f4f6",
            color: "#e11d48",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "'Fira Code', 'Courier New', monospace",
          }}
        >
          {node.props.code as string}
        </CodeInline>
      );
    case "EmailMarkdown":
      return (
        <Markdown
          markdownCustomStyles={{
            p: { color: "#374151", fontSize: "16px", lineHeight: "24px" },
            link: { color: "#5F51E8", textDecoration: "underline" },
            h1: { color: "#1a1a1a", fontSize: "28px" },
            h2: { color: "#1a1a1a", fontSize: "22px" },
            h3: { color: "#1a1a1a", fontSize: "18px" },
          }}
        >
          {node.props.content as string}
        </Markdown>
      );
    case "EmailRow": {
      const children = (node.props.children as ElementNode[]) ?? [];
      return (
        <Row style={{ margin: "0 0 16px 0" }}>
          {children.map((child, i) => {
            const el = buildElement(child);
            return el ? <span key={i}>{el}</span> : null;
          })}
        </Row>
      );
    }
    case "EmailContainer": {
      const children = (node.props.children as ElementNode[]) ?? [];
      return (
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "0 20px" }}>
          {children.map((child, i) => {
            const el = buildElement(child);
            return el ? <span key={i}>{el}</span> : null;
          })}
        </Container>
      );
    }
    case "EmailHeaderSideNav": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const links = (node.props.links ?? []) as any[];
      const logoHeight = ((node.props.logoHeight as number) ?? 42).toString();
      return (
        <Section style={{ padding: "40px 32px" }}>
          <Row>
            <Column style={{ width: "80%" }}>
              <Img
                alt={node.props.logoAlt as string}
                height={logoHeight}
                src={node.props.logoSrc as string}
              />
            </Column>
            <Column align="right">
              <Row align="right">
                {links.map((link: { props?: { text?: string; href?: string } }, i: number) => (
                  <Column key={i} style={{ paddingLeft: "8px", paddingRight: "8px" }}>
                    <Link
                      href={String(link?.props?.href ?? "#")}
                      style={{ color: "#4b5563", textDecoration: "none", fontSize: "14px" }}
                    >
                      {String(link?.props?.text ?? "")}
                    </Link>
                  </Column>
                ))}
              </Row>
            </Column>
          </Row>
        </Section>
      );
    }
    case "EmailHeaderCenteredNav": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const links = (node.props.links ?? []) as any[];
      const logoHeight = ((node.props.logoHeight as number) ?? 42).toString();
      return (
        <Section style={{ padding: "40px 32px" }}>
          <Row>
            <Column align="center">
              <Img
                alt={node.props.logoAlt as string}
                height={logoHeight}
                src={node.props.logoSrc as string}
              />
            </Column>
          </Row>
          <Row style={{ marginTop: "40px" }}>
            <Column align="center">
              <table>
                <tbody>
                  <tr>
                    {links.map((link: { props?: { text?: string; href?: string } }, i: number) => (
                      <td key={i} style={{ paddingLeft: "8px", paddingRight: "8px" }}>
                        <Link
                          href={String(link?.props?.href ?? "#")}
                          style={{ color: "#4b5563", textDecoration: "none", fontSize: "14px" }}
                        >
                          {String(link?.props?.text ?? "")}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Column>
          </Row>
        </Section>
      );
    }
    case "EmailHeaderSocial": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const icons = (node.props.icons ?? []) as any[];
      const logoHeight = ((node.props.logoHeight as number) ?? 42).toString();
      return (
        <Section style={{ padding: "32px" }}>
          <Row>
            <Column style={{ width: "80%" }}>
              <Img
                alt={node.props.logoAlt as string}
                width="42"
                height={logoHeight}
                src={node.props.logoSrc as string}
              />
            </Column>
            <Column align="right">
              <Row align="right">
                {icons.map((icon: { props?: { src?: string; alt?: string; href?: string } }, i: number) => (
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
    }
    case "EmailFooterCentered": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const icons = (node.props.icons ?? []) as any[];
      return (
        <Section style={{ textAlign: "center" as const }}>
          <table style={{ width: "100%" }}>
            <tbody>
              <tr style={{ width: "100%" }}>
                <td align="center">
                  <Img
                    alt={node.props.logoAlt as string}
                    height="42"
                    src={node.props.logoSrc as string}
                    width="42"
                  />
                </td>
              </tr>
              <tr style={{ width: "100%" }}>
                <td align="center">
                  <Text
                    style={{
                      margin: "8px 0",
                      fontWeight: 600,
                      fontSize: "16px",
                      color: "#111827",
                      lineHeight: "24px",
                    }}
                  >
                    {node.props.companyName as string}
                  </Text>
                  {node.props.tagline ? (
                    <Text
                      style={{
                        marginTop: "4px",
                        marginBottom: 0,
                        fontSize: "16px",
                        color: "#6b7280",
                        lineHeight: "24px",
                      }}
                    >
                      {node.props.tagline as string}
                    </Text>
                  ) : null}
                </td>
              </tr>
              {icons.length > 0 && (
                <tr>
                  <td align="center">
                    <Row
                      style={{
                        display: "table-cell",
                        height: "44px",
                        width: "56px",
                        verticalAlign: "bottom",
                      }}
                    >
                      {icons.map((icon: { props?: { src?: string; alt?: string; href?: string } }, i: number) => (
                        <Column key={i} style={{ paddingRight: i < icons.length - 1 ? "8px" : "0" }}>
                          <Link href={String(icon?.props?.href ?? "#")}>
                            <Img
                              alt={String(icon?.props?.alt ?? "")}
                              height="36"
                              src={String(icon?.props?.src ?? "")}
                              width="36"
                            />
                          </Link>
                        </Column>
                      ))}
                    </Row>
                  </td>
                </tr>
              )}
              <tr>
                <td align="center">
                  <Text style={{ margin: "8px 0", fontWeight: 600, fontSize: "16px", color: "#6b7280", lineHeight: "24px" }}>
                    {node.props.address as string}
                  </Text>
                  {node.props.contact ? (
                    <Text style={{ marginTop: "4px", marginBottom: 0, fontWeight: 600, fontSize: "16px", color: "#6b7280", lineHeight: "24px" }}>
                      {node.props.contact as string}
                    </Text>
                  ) : null}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      );
    }
    case "EmailFooterTwoColumn": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const icons = (node.props.icons ?? []) as any[];
      return (
        <Section>
          <Row>
            <Column style={{ verticalAlign: "bottom" }}>
              <Img
                alt={node.props.logoAlt as string}
                height="42"
                src={node.props.logoSrc as string}
              />
              <Text style={{ margin: "8px 0", fontWeight: 600, fontSize: "16px", color: "#111827", lineHeight: "24px" }}>
                {node.props.companyName as string}
              </Text>
              {node.props.tagline ? (
                <Text style={{ marginTop: "4px", marginBottom: 0, fontSize: "16px", color: "#6b7280", lineHeight: "24px" }}>
                  {node.props.tagline as string}
                </Text>
              ) : null}
            </Column>
            <Column align="left" style={{ verticalAlign: "bottom" }}>
              {icons.length > 0 && (
                <Row
                  style={{
                    display: "table-cell",
                    height: "44px",
                    width: "56px",
                    verticalAlign: "bottom",
                  }}
                >
                  {icons.map((icon: { props?: { src?: string; alt?: string; href?: string } }, i: number) => (
                    <Column key={i} style={{ paddingRight: i < icons.length - 1 ? "8px" : "0" }}>
                      <Link href={String(icon?.props?.href ?? "#")}>
                        <Img
                          alt={String(icon?.props?.alt ?? "")}
                          height="36"
                          src={String(icon?.props?.src ?? "")}
                          width="36"
                        />
                      </Link>
                    </Column>
                  ))}
                </Row>
              )}
              <Row>
                <Text style={{ margin: "8px 0", fontWeight: 600, fontSize: "16px", color: "#6b7280", lineHeight: "24px" }}>
                  {node.props.address as string}
                </Text>
                {node.props.contact ? (
                  <Text style={{ marginTop: "4px", marginBottom: 0, fontWeight: 600, fontSize: "16px", color: "#6b7280", lineHeight: "24px" }}>
                    {node.props.contact as string}
                  </Text>
                ) : null}
              </Row>
            </Column>
          </Row>
        </Section>
      );
    }
    case "EmailArticle": {
      const bg = (node.props.buttonColor as string) ?? "#4F46E5";
      return (
        <Section style={{ marginTop: 16, marginBottom: 16 }}>
          <Img
            alt={node.props.imageAlt as string}
            height="320"
            src={node.props.imageSrc as string}
            style={{ width: "100%", borderRadius: 12, objectFit: "cover" }}
          />
          <Section style={{ marginTop: 32, textAlign: "center" as const }}>
            {node.props.category ? (
              <Text style={{ marginTop: 16, marginBottom: 16, fontSize: 18, lineHeight: "28px", fontWeight: 600, color: "#4F46E5" }}>
                {node.props.category as string}
              </Text>
            ) : null}
            <Heading as="h1" style={{ margin: "0px", marginTop: 8, fontSize: 36, lineHeight: "36px", fontWeight: 600, color: "#111827" }}>
              {node.props.title as string}
            </Heading>
            <Text style={{ fontSize: 16, lineHeight: "24px", color: "#6B7280" }}>
              {node.props.description as string}
            </Text>
            <Button href={node.props.buttonHref as string} style={{ marginTop: 16, borderRadius: 8, backgroundColor: bg, paddingLeft: 40, paddingRight: 40, paddingTop: 12, paddingBottom: 12, fontWeight: 600, color: "#ffffff" }}>
              {node.props.buttonLabel as string}
            </Button>
          </Section>
        </Section>
      );
    }
    case "EmailProductCard": {
      const bg = (node.props.buttonColor as string) ?? "#4F46E5";
      return (
        <Section style={{ marginTop: 16, marginBottom: 16 }}>
          <Img alt={node.props.imageAlt as string} height="320" src={node.props.imageSrc as string} style={{ width: "100%", borderRadius: 12, objectFit: "cover" }} />
          <Section style={{ marginTop: 32, textAlign: "center" as const }}>
            {node.props.category ? (
              <Text style={{ marginTop: 16, fontSize: 18, lineHeight: "28px", fontWeight: 600, color: "#4F46E5" }}>{node.props.category as string}</Text>
            ) : null}
            <Heading as="h1" style={{ fontSize: 36, lineHeight: "40px", fontWeight: 600, color: "#111827" }}>{node.props.title as string}</Heading>
            <Text style={{ marginTop: 8, fontSize: 16, lineHeight: "24px", color: "#6B7280" }}>{node.props.description as string}</Text>
            <Text style={{ fontSize: 16, lineHeight: "24px", fontWeight: 600, color: "#111827" }}>{node.props.price as string}</Text>
            <Button href={node.props.buttonHref as string} style={{ marginTop: 16, borderRadius: 8, backgroundColor: bg, paddingLeft: 24, paddingRight: 24, paddingTop: 12, paddingBottom: 12, fontWeight: 600, color: "#ffffff" }}>
              {node.props.buttonLabel as string}
            </Button>
          </Section>
        </Section>
      );
    }
    case "EmailFeatureGrid": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (node.props.items ?? []) as any[];
      return (
        <Section style={{ marginTop: 16, marginBottom: 16 }}>
          <Row>
            <Text style={{ margin: "0px", fontSize: 24, lineHeight: "32px", fontWeight: 600, color: "#111827" }}>{node.props.title as string}</Text>
            <Text style={{ marginTop: 8, fontSize: 16, lineHeight: "24px", color: "#6B7280" }}>{node.props.description as string}</Text>
          </Row>
          {[0, 2].map((startIdx) => (
            <Row key={startIdx} style={{ marginTop: startIdx === 0 ? 16 : 32 }}>
              {items.slice(startIdx, startIdx + 2).map((item: ElementNode, i: number) => (
                <Column key={i} style={{ width: "50%", paddingRight: i === 0 ? 12 : 0, paddingLeft: i === 1 ? 12 : 0, verticalAlign: "baseline" }}>
                  <Img alt={String(item?.props?.iconAlt ?? "")} height="48" src={String(item?.props?.iconSrc ?? "")} width="48" />
                  <Text style={{ margin: "0px", marginTop: 16, fontSize: 20, lineHeight: "28px", fontWeight: 600, color: "#111827" }}>{String(item?.props?.title ?? "")}</Text>
                  <Text style={{ marginBottom: "0px", marginTop: 8, fontSize: 16, lineHeight: "24px", color: "#6B7280" }}>{String(item?.props?.description ?? "")}</Text>
                </Column>
              ))}
            </Row>
          ))}
        </Section>
      );
    }
    case "EmailFeatureList": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (node.props.items ?? []) as any[];
      return (
        <Section style={{ marginTop: 16, marginBottom: 16 }}>
          <Section>
            <Row>
              <Text style={{ margin: "0px", fontSize: 24, lineHeight: "32px", fontWeight: 600, color: "#111827" }}>{node.props.title as string}</Text>
              <Text style={{ marginTop: 8, fontSize: 16, lineHeight: "24px", color: "#6B7280" }}>{node.props.description as string}</Text>
            </Row>
          </Section>
          <Section>
            {items.map((item: ElementNode, i: number) => (
              <span key={i}>
                <Hr style={{ marginLeft: "0px", marginRight: "0px", marginTop: 32, marginBottom: 32, width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: "#D1D5DB" }} />
                <Section>
                  <Row>
                    <Column style={{ verticalAlign: "baseline" }}>
                      <Img alt={String(item?.props?.iconAlt ?? "")} height="48" src={String(item?.props?.iconSrc ?? "")} width="48" />
                    </Column>
                    <Column style={{ width: "85%" }}>
                      <Text style={{ margin: "0px", fontSize: 20, fontWeight: 600, lineHeight: "28px", color: "#111827" }}>{String(item?.props?.title ?? "")}</Text>
                      <Text style={{ margin: "0px", marginTop: 8, fontSize: 16, lineHeight: "24px", color: "#6B7280" }}>{String(item?.props?.description ?? "")}</Text>
                    </Column>
                  </Row>
                </Section>
              </span>
            ))}
          </Section>
        </Section>
      );
    }
    case "EmailNumberedSteps": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const steps = (node.props.steps ?? []) as any[];
      return (
        <Section style={{ marginTop: 16 }}>
          <Section style={{ paddingBottom: 24 }}>
            <Row>
              <Text style={{ margin: 0, fontWeight: 600, fontSize: 24, color: "#111827", lineHeight: "32px" }}>{node.props.title as string}</Text>
              <Text style={{ marginTop: 8, fontSize: 16, color: "#6B7280", lineHeight: "24px" }}>{node.props.description as string}</Text>
            </Row>
          </Section>
          {steps.map((step: ElementNode, index: number) => (
            <span key={index}>
              <Hr style={{ border: "1px solid #D1D5DB", margin: 0, width: "100%" }} />
              <Section style={{ paddingTop: 24, paddingBottom: 24 }}>
                <Row>
                  <Column width="48" height="40" style={{ width: 40, height: 40, paddingRight: 8 }} valign="baseline">
                    <Row width="40" align="left">
                      <Column align="center" height="40" style={{ backgroundColor: "#C7D2FE", borderRadius: "9999px", color: "#4F46E5", fontWeight: 600, height: 40, padding: 0, width: 40 }} valign="middle" width="40">
                        {String(index + 1)}
                      </Column>
                    </Row>
                  </Column>
                  <Column width="100%" style={{ width: "100%" }}>
                    <Text style={{ margin: 0, fontWeight: 600, fontSize: 20, lineHeight: "28px", color: "#111827" }}>{String(step?.props?.title ?? "")}</Text>
                    <Text style={{ margin: 0, paddingTop: 8, fontSize: 16, lineHeight: "24px", color: "#6B7280" }}>{String(step?.props?.description ?? "")}</Text>
                  </Column>
                </Row>
              </Section>
            </span>
          ))}
        </Section>
      );
    }
    case "EmailCheckoutTable": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (node.props.items ?? []) as any[];
      const bg = (node.props.buttonColor as string) ?? "#4F46E5";
      const title = (node.props.title as string) ?? "You left something in your cart";
      return (
        <Section style={{ paddingTop: 16, paddingBottom: 16, textAlign: "center" as const }}>
          <Heading as="h1" style={{ fontSize: 30, lineHeight: "36px", marginBottom: "0px", fontWeight: 600 }}>{title}</Heading>
          <Section style={{ padding: 16, paddingTop: "0px", marginTop: 16, marginBottom: 16, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: "#E5E7EB" }}>
            <table style={{ marginBottom: 16 }} width="100%">
              <tbody>
                {items.map((item: ElementNode, i: number) => (
                  <tr key={i}>
                    <td style={{ paddingTop: 8, paddingBottom: 8, borderWidth: "0px", borderBottomWidth: 1, borderStyle: "solid", borderColor: "#E5E7EB" }}>
                      {item?.props?.imageSrc ? <Img alt={String(item?.props?.imageAlt ?? "")} height={110} src={String(item?.props?.imageSrc)} style={{ objectFit: "cover", borderRadius: 8 }} /> : null}
                    </td>
                    <td align="left" colSpan={6} style={{ paddingTop: 8, paddingBottom: 8, borderWidth: "0px", borderBottomWidth: 1, borderStyle: "solid", borderColor: "#E5E7EB" }}>
                      <Text>{String(item?.props?.name ?? "")}</Text>
                    </td>
                    <td align="center" style={{ paddingTop: 8, paddingBottom: 8, borderWidth: "0px", borderBottomWidth: 1, borderStyle: "solid", borderColor: "#E5E7EB" }}>
                      <Text>{String(item?.props?.quantity ?? 1)}</Text>
                    </td>
                    <td align="center" style={{ paddingTop: 8, paddingBottom: 8, borderWidth: "0px", borderBottomWidth: 1, borderStyle: "solid", borderColor: "#E5E7EB" }}>
                      <Text>{String(item?.props?.price ?? "")}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Row>
              <Column align="center">
                <Button href={node.props.buttonHref as string} style={{ width: "100%", boxSizing: "border-box", paddingLeft: 12, paddingRight: 12, borderRadius: 8, textAlign: "center" as const, backgroundColor: bg, paddingTop: 12, paddingBottom: 12, fontWeight: 600, color: "#ffffff" }}>
                  {node.props.buttonLabel as string}
                </Button>
              </Column>
            </Row>
          </Section>
        </Section>
      );
    }
    case "EmailPricingCard": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const features = (node.props.features ?? []) as any[];
      const bg = (node.props.buttonColor as string) ?? "#4F46E5";
      const period = (node.props.period as string) ?? "/ month";
      return (
        <Section style={{ backgroundColor: "#ffffff", borderColor: "#D1D5DB", borderRadius: 12, borderStyle: "solid", borderWidth: 1, color: "#4B5563", padding: 28, textAlign: "left" as const, width: "100%" }}>
          {node.props.badge ? (
            <Text style={{ color: "#4F46E5", fontSize: 12, fontWeight: 600, letterSpacing: "0.025em", lineHeight: "20px", marginBottom: 16, textTransform: "uppercase" as const }}>{node.props.badge as string}</Text>
          ) : null}
          <Text style={{ fontSize: 30, fontWeight: 700, lineHeight: "36px", marginBottom: 12, marginTop: "0px" }}>
            <span style={{ color: "#101828" }}>{node.props.price as string}</span>{" "}
            <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "20px" }}>{period}</span>
          </Text>
          <Text style={{ color: "#374151", fontSize: 14, lineHeight: "20px", marginTop: 16, marginBottom: 24 }}>{node.props.description as string}</Text>
          <ul style={{ color: "#6B7280", fontSize: 14, lineHeight: "24px", marginBottom: 32, paddingLeft: 14 }}>
            {features.map((feat: ElementNode, i: number) => (
              <li key={i} style={{ marginBottom: 12 }}>{String(feat?.props?.text ?? "")}</li>
            ))}
          </ul>
          <Button href={node.props.buttonHref as string} style={{ backgroundColor: bg, borderRadius: 8, boxSizing: "border-box", color: "#ffffff", display: "inline-block", fontSize: 16, lineHeight: "24px", fontWeight: 700, letterSpacing: "0.025em", marginBottom: 24, maxWidth: "100%", padding: 14, textAlign: "center" as const, width: "100%" }}>
            {node.props.buttonLabel as string}
          </Button>
          {node.props.note ? (
            <>
              <Hr />
              <Text style={{ color: "#6B7280", fontSize: 12, lineHeight: "16px", fontStyle: "italic", marginTop: 24, marginBottom: 6, textAlign: "center" as const }}>{node.props.note as string}</Text>
            </>
          ) : null}
        </Section>
      );
    }
    case "EmailTestimonial":
      return (
        <Section style={{ textAlign: "center" as const, fontSize: 14, lineHeight: "20px", color: "#4B5563" }}>
          <Text style={{ margin: 0, fontSize: 16, lineHeight: "24px", fontWeight: 300, color: "#1F2937" }}>{node.props.quote as string}</Text>
          <Row style={{ marginTop: "32px" }} align="center">
            <Column valign="middle">
              <Img src={node.props.avatarSrc as string} width={32} height={32} alt={node.props.avatarAlt as string} style={{ height: 32, width: 32, borderRadius: "9999px", objectFit: "cover" }} />
            </Column>
            <Column valign="middle">
              <Text style={{ margin: 0, marginLeft: 12, fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "#111827", marginRight: 8 }}>{node.props.name as string}</Text>
            </Column>
            <Column valign="middle">
              <Text style={{ fontSize: 14, lineHeight: "20px", marginRight: 8, margin: 0 }}>&bull;</Text>
            </Column>
            <Column valign="middle">
              <Text style={{ margin: 0, fontSize: 14, lineHeight: "20px" }}>{node.props.role as string}</Text>
            </Column>
          </Row>
        </Section>
      );
    case "EmailSurveyRating": {
      const bg = (node.props.buttonColor as string) ?? "#4F46E5";
      return (
        <Section style={{ textAlign: "center" as const, paddingTop: 16, paddingBottom: 16 }}>
          <Text style={{ marginTop: 8, marginBottom: 8, fontSize: 18, lineHeight: "28px", fontWeight: 600, color: "#4F46E5" }}>Your opinion matters</Text>
          <Heading as="h1" style={{ margin: "0px", marginTop: 8, fontSize: 30, lineHeight: "36px", fontWeight: 600, color: "#111827" }}>{node.props.question as string}</Heading>
          {node.props.description ? (
            <Text style={{ fontSize: 16, lineHeight: "24px", color: "#374151" }}>{node.props.description as string}</Text>
          ) : null}
          <Row>
            <Column align="center">
              <table>
                <tbody>
                  <tr>
                    {[1, 2, 3, 4, 5].map((number) => (
                      <td align="center" key={number} style={{ padding: 4 }}>
                        <Button href={`#rating-${number}`} style={{ height: 20, width: 20, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: bg, padding: 8, fontWeight: 600, color: bg }}>
                          {number}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Column>
          </Row>
        </Section>
      );
    }
    case "EmailStats": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (node.props.items ?? []) as any[];
      return (
        <Row>
          {items.map((item: ElementNode, i: number) => (
            <Column key={i}>
              <Text style={{ margin: 0, textAlign: "left" as const, fontSize: 18, lineHeight: "24px", fontWeight: 700, letterSpacing: "-0.025em", color: "#111827" }}>{String(item?.props?.value ?? "")}</Text>
              <Text style={{ margin: 0, textAlign: "left" as const, fontSize: 12, lineHeight: "18px", color: "#6B7280" }}>{String(item?.props?.label ?? "")}</Text>
            </Column>
          ))}
        </Row>
      );
    }
    case "EmailImageGrid": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const images = (node.props.images ?? []) as any[];
      return (
        <Section style={{ marginTop: 16, marginBottom: 16 }}>
          {(node.props.title || node.props.description) ? (
            <Section style={{ marginTop: 42 }}>
              <Row>
                {node.props.title ? <Text style={{ margin: "0px", marginTop: 8, fontSize: 24, lineHeight: "32px", fontWeight: 600, color: "#111827" }}>{node.props.title as string}</Text> : null}
                {node.props.description ? <Text style={{ marginTop: 8, fontSize: 16, lineHeight: "24px", color: "#6B7280" }}>{node.props.description as string}</Text> : null}
              </Row>
            </Section>
          ) : null}
          <Section style={{ marginTop: 16 }}>
            {[0, 2].map((startIdx) => {
              const rowImages = images.slice(startIdx, startIdx + 2);
              if (rowImages.length === 0) return null;
              return (
                <Row key={startIdx} style={{ marginTop: startIdx > 0 ? 16 : 0 }}>
                  {rowImages.map((img: ElementNode, i: number) => (
                    <Column key={i} style={{ width: "50%", paddingRight: i === 0 ? 8 : 0, paddingLeft: i === 1 ? 8 : 0 }}>
                      <Img alt={String(img?.props?.alt ?? "")} height={288} src={String(img?.props?.src ?? "")} style={{ width: "100%", borderRadius: 12, objectFit: "cover" }} />
                    </Column>
                  ))}
                </Row>
              );
            })}
          </Section>
        </Section>
      );
    }
    case "EmailNavLink":
    case "EmailSocialIcon":
    case "EmailFeatureItem":
    case "EmailStepItem":
    case "EmailCheckoutItem":
    case "EmailPricingFeature":
    case "EmailStatItem":
      return null;
    case "EmailPreview":
      return <Preview>{(node.props.text as string) ?? ""}</Preview>;
    case "EmailHtml":
    case "EmailHead":
    case "EmailBody":
    case "EmailFont":
    case "EmailTailwind":
      return null;
    default:
      return null;
  }
}

export async function renderEmailToHtml(
  subject: string,
  previewText: string,
  children: ElementNode[],
): Promise<string> {
  const emailComponent = (
    <Tailwind>
      <Html lang="en">
        <Head>
          <Font
            fontFamily="Inter"
            fallbackFontFamily="Arial"
            webFont={{
              url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
              format: "woff2",
            }}
          />
        </Head>
        {previewText && <Preview>{previewText}</Preview>}
        <Body
        style={{
          backgroundColor: "#f6f9fc",
          margin: "0",
          padding: "0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            margin: "40px auto",
            padding: "32px 40px",
            maxWidth: "600px",
          }}
        >
          {children.map((child, i) => {
            const el = buildElement(child);
            return el ? <span key={i}>{el}</span> : null;
          })}
        </Container>
      </Body>
      </Html>
    </Tailwind>
  );

  const html = await render(emailComponent);
  return html;
}
