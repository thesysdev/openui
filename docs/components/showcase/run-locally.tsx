"use client";

import { Popover, PopoverContent, PopoverTrigger } from "fumadocs-ui/components/ui/popover";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Copy, SquareTerminal } from "lucide-react";
import { Fragment } from "react";
import styles from "./showcase.module.css";

type RunLocallyProps = {
  title: string;
  name: string;
  envKey?: string;
};

/** Shows the exact `openui create` command for an example and what it will ask for. */
export function RunLocally({ title, name, envKey }: RunLocallyProps) {
  const command = `npx @openuidev/cli@latest create --example ${name}`;
  const [copied, onCopy] = useCopyButton(() => navigator.clipboard.writeText(command));

  return (
    <Popover>
      <PopoverTrigger className={styles.runButton}>
        <SquareTerminal aria-hidden className={styles.cardLinkIcon} />
        Run locally
      </PopoverTrigger>
      <PopoverContent align="start" className={styles.runPopover}>
        <p className={styles.runTitle}>Run {title} locally</p>
        <div className={styles.runCommand}>
          {/* Wrap only between words so a flag like `--example` never splits across lines. */}
          <code>
            {command.split(" ").map((word, index) => (
              <Fragment key={index}>
                {index > 0 ? " " : null}
                <span className={styles.runWord}>{word}</span>
              </Fragment>
            ))}
          </code>
          <button
            type="button"
            className={styles.runCopy}
            aria-label={copied ? "Copied command" : "Copy command"}
            onClick={onCopy}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          </button>
        </div>
        <p className={styles.runNote}>
          {envKey ? (
            <>
              The CLI copies the example into a new folder and asks for your <code>{envKey}</code>,
              which it saves to <code>.env</code>.
            </>
          ) : (
            <>
              The CLI copies the example into a new folder. This one needs more than one API key, so
              set them as its README describes.
            </>
          )}
        </p>
      </PopoverContent>
    </Popover>
  );
}
