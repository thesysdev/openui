import {
  BlankScreens,
  CompletionByModel,
  CostPerPass,
  TokenOverhead,
} from "@/components/charts/benchmark-charts";
import { CompletionByDensity } from "@/components/charts/completion-by-density";
import {
  DgAnatomy,
  DgCrossLibrary,
  DgErrorExample,
  DgLoop,
  DgScoreboard,
  DgSpeedArc,
} from "@/components/charts/diffusion-charts";
import { CodeBlockTabs } from "@/components/code-block-tabs";
import { DocsCard } from "@/components/docs-card";
import { FakeVisual } from "@/components/fake-visual";
import { Mermaid } from "@/components/mermaid";
import { ModelReleaseCards } from "@/components/model-release-cards";
import { TweetEmbed } from "@/components/tweet-embed";
import { prefetchFor } from "@/lib/prefetch";
import Link from "fumadocs-core/link";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes } from "react";

// Next.js <Link> does not scroll to same-page anchors, so "#" links use a plain <a>.
export function MdxLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return props.href?.startsWith("#") ? (
    <a {...props} />
  ) : (
    <Link {...props} prefetch={prefetchFor(props.href)} />
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    a: MdxLink,
    CodeBlockTabs,
    Card: DocsCard,
    TweetEmbed,
    FakeVisual,
    CompletionByModel,
    CompletionByDensity,
    BlankScreens,
    DgScoreboard,
    DgAnatomy,
    DgLoop,
    DgSpeedArc,
    DgCrossLibrary,
    DgErrorExample,
    TokenOverhead,
    CostPerPass,
    Mermaid,
    ModelReleaseCards,
    ...components,
  };
}
