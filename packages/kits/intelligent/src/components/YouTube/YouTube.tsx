import clsx from "clsx";
import { names, styles } from "./youTube.styles";

const YT = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})|^([\w-]{11})$/;

export interface YouTubeProps {
  /** A video id or a YouTube URL. */
  video: string;
  title?: string;
}

/** An embedded YouTube video, played from youtube-nocookie.com. */
export function YouTube({ video, title }: YouTubeProps) {
  const m = YT.exec(video.trim());
  const id = m?.[1] ?? m?.[2];
  if (!id) return null;
  return (
    <div className={clsx(styles.root, names.root)}>
      <iframe
        className={clsx(styles.frame, names.frame)}
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title || "YouTube video"}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  );
}
