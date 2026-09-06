import {
  BlankScreens,
  CompletionByModel,
  CostPerPass,
  TokenOverhead,
} from "@/components/charts/benchmark-charts";
import { CompletionByDensity } from "@/components/charts/completion-by-density";
import {
  DgAnatomy,
  DgBands,
  DgDial,
  DgLoop,
  DgScoreboard,
  DgSpeed,
} from "@/components/charts/diffusion-charts";
import { FakeVisual } from "@/components/fake-visual";
import { Mermaid } from "@/components/mermaid";
import { TweetEmbed } from "@/components/tweet-embed";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    TweetEmbed,
    FakeVisual,
    CompletionByModel,
    CompletionByDensity,
    BlankScreens,
    DgScoreboard,
    DgAnatomy,
    DgBands,
    DgLoop,
    DgDial,
    DgSpeed,
    TokenOverhead,
    CostPerPass,
    Mermaid,
    ...components,
  };
}
