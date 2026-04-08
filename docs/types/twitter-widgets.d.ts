/** Loaded by https://platform.twitter.com/widgets.js */
declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          element: HTMLElement,
          options?: {
            align?: "center" | "left" | "right";
            conversation?: "all" | "none";
            dnt?: boolean;
            theme?: "light" | "dark";
            width?: number;
          },
        ) => Promise<HTMLElement>;
        load: (element?: HTMLElement | null) => void;
      };
    };
  }
}

export {};
