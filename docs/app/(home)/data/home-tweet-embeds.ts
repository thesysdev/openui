export type HomeTweetEmbed = {
  id: string;
  conversation?: "all" | "none";
};

/** Official X tweet IDs used to render real embeds via widgets.createTweet(). */
export const HOME_TWEETS: HomeTweetEmbed[] = [
  { id: "2031845364286783776", conversation: "none" },
  { id: "2031989015147397122", conversation: "none" },
  { id: "2031891607394664677", conversation: "none" },
  { id: "2034082798051443052", conversation: "none" },
  { id: "2034668122691735612", conversation: "none" },
  { id: "2034668644115107891", conversation: "none" },
  { id: "2039548793960681815", conversation: "none" },
  { id: "2032387346616758375", conversation: "none" },
  { id: "2034284259805176222", conversation: "none" },
];
