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
import { DocsCard } from "@/components/docs-card";
import { FakeVisual } from "@/components/fake-visual";
import { Mermaid } from "@/components/mermaid";
import { ModelReleaseCards } from "@/components/model-release-cards";
import { TweetEmbed } from "@/components/tweet-embed";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
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
