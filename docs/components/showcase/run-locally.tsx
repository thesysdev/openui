"use client";

import buttonStyles from "@/app/(home)/components/Button/Button.module.css";
import { copyText } from "@/lib/copy-text";
import { captureGalleryEvent, captureTemplateCopy } from "@/lib/demo-gallery-analytics";
import { Button } from "@openuidev/react-ui";
import { Popover, PopoverContent, PopoverTrigger } from "fumadocs-ui/components/ui/popover";
import { Check, Copy, Github, SquareTerminal } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import styles from "./showcase.module.css";

type RunLocallyProps = {
  title: string;
  name: string;
  env?: { file: string; key?: string };
  label?: string;
  demoId?: string;
};

/** Shows the exact `openui create` command for an example and what it will ask for. */
export function RunLocally({ title, name, env, label = "Run locally", demoId }: RunLocallyProps) {
  const command = name.startsWith("repo:")
    ? `pnpm dlx @openuidev/cli@latest create --name ${name.split("/").at(-1)} --example ${name}`
    : `npx @openuidev/cli@latest create --example ${name}`;
  const [copyError, setCopyError] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  async function onCopy() {
    try {
      if (!(await copyText(command))) throw new Error("Copy failed");
      setCopyError(false);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
      if (demoId) captureTemplateCopy(command, demoId);
    } catch {
      setCopyError(true);
      setCopied(false);
      if (demoId) captureGalleryEvent("demo:copy_failed", demoId, "local_template");
    }
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && demoId)
          captureGalleryEvent("demo:cta_clicked", demoId, "template_instructions");
      }}
    >
      {demoId ? (
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="small"
            variant="tertiary"
            className={`${buttonStyles.pillBase} ${styles.demoAction} ${styles.demoTertiary}`}
          >
            {label}
          </Button>
        </PopoverTrigger>
      ) : (
        <PopoverTrigger className={styles.runButton}>
          <SquareTerminal aria-hidden className={styles.cardLinkIcon} />
          {label}
        </PopoverTrigger>
      )}
      <PopoverContent align="start" className={styles.runPopover}>
        <p className={styles.runTitle}>{demoId ? `Use ${title}` : `Run ${title} locally`}</p>
        {demoId && <p className={styles.runNote}>Run this command in your terminal.</p>}
        <div className={styles.runCommand}>
          {/* Wrap only between words so a flag like `--example` never splits across lines. */}
          <code>
            {demoId
              ? command
              : command.split(" ").map((word, index) => (
                  <Fragment key={index}>
                    {index > 0 ? " " : null}
                    <span className={styles.runWord}>{word}</span>
                  </Fragment>
                ))}
          </code>
          {!demoId && (
            <button
              type="button"
              className={styles.runCopy}
              aria-label={copied ? "Copied command" : "Copy command"}
              onClick={onCopy}
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            </button>
          )}
        </div>
        {demoId && (
          <div className={styles.runActions}>
            <Button
              type="button"
              size="small"
              onClick={onCopy}
              className={`${buttonStyles.pillBase} ${buttonStyles.pillPrimary} ${styles.runAction} ${styles.runActionPrimary}`}
              iconLeft={copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            >
              {copied ? "Copied!" : "Copy command"}
            </Button>
            {name.startsWith("repo:") && (
              <a
                className={`${buttonStyles.pillBase} ${buttonStyles.pillSecondary} ${styles.runAction}`}
                href={`https://github.com/${name.slice(5)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => captureGalleryEvent("demo:cta_clicked", demoId, "source")}
              >
                <Github aria-hidden /> View on GitHub
              </a>
            )}
          </div>
        )}
        <span role="status" className={styles.runNote}>
          {copyError
            ? "Copy failed. Select the command and copy it."
            : copied
              ? "Command copied."
              : ""}
        </span>
        <p className={styles.runNote}>
          {demoId ? (
            <>Requires API keys. Check the README for setup and model costs.</>
          ) : env?.key ? (
            <>
              The CLI copies the example into a new folder and asks for your <code>{env.key}</code>,
              which it saves to <code>{env.file}</code>.
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
