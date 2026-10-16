export type HomeTweetEmbed = {
  id: string;
  conversation?: "all" | "none";
};

/** Official X tweet IDs used to render real embeds via widgets.createTweet(). */
export const HOME_TWEETS: HomeTweetEmbed[] = [
  { id: "2105153144506503199", conversation: "none" }, // LynxJS_org, Lynx 4.0 ships OpenUI
  { id: "2073320566052773925", conversation: "none" }, // patrickzachar, Productboard
  { id: "2098624943218913364", conversation: "none" }, // tom_doerr
  { id: "2078595004768125289", conversation: "none" }, // alaymanguy, mcpcn by shadcnlabs
  { id: "2073104523670049265", conversation: "none" }, // mastra
  { id: "2034082798051443052", conversation: "none" }, // shadcn
  { id: "2055562604958114141", conversation: "none" }, // yusukebe, Hono
  { id: "2100211596886704477", conversation: "none" }, // DanKornas
  { id: "2072776323135938960", conversation: "none" }, // shardara, Eve
  { id: "2031845364286783776", conversation: "none" }, // ctatedev
  { id: "2102835411651273135", conversation: "none" }, // waynesutton, Convex
  { id: "2088006688011891142", conversation: "none" }, // saurra3h, beUI
  { id: "2034668122691735612", conversation: "none" }, // LangChain_JS
  { id: "2086618877060898948", conversation: "none" }, // ZacharyByDesign, Prime Agent
  { id: "2034668644115107891", conversation: "none" }, // bromann, LangChain
];
