"use client";

import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import { componentHoverTooltip, type ComponentDefs } from "@paste/lib/editor/hover";
import { openuiLang } from "@paste/lib/editor/openui-lang";
import styles from "@paste/paste.module.css";

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    backgroundColor: "transparent",
  },
  ".cm-content": {
    fontFamily: "var(--openui-font-code, ui-monospace, SFMono-Regular, monospace)",
    caretColor: "var(--openui-text-neutral-primary, currentColor)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--openui-text-neutral-tertiary, #888)",
    border: "none",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-activeLine": { backgroundColor: "var(--openui-sunk, rgba(0,0,0,0.03))" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
});

export function EditorPane({
  code,
  onChange,
  readOnly,
  componentDefs,
}: {
  code: string;
  onChange: (code: string) => void;
  readOnly: boolean;
  /** Active library's schema $defs — powers hover signatures. */
  componentDefs: ComponentDefs | null;
}) {
  const extensions = useMemo(
    () => [
      openuiLang,
      editorTheme,
      EditorView.lineWrapping,
      componentHoverTooltip(() => componentDefs),
    ],
    [componentDefs],
  );
  // Docs theming is class-based via next-themes, not prefers-color-scheme.
  const dark = useTheme().resolvedTheme === "dark";
  return (
    <div className={styles.editorPane}>
      <CodeMirror
        value={code}
        onChange={onChange}
        extensions={extensions}
        // Built-in dark theme keeps syntax colors readable on the dark token
        // background; our editorTheme keeps the background itself transparent.
        theme={dark ? "dark" : "light"}
        readOnly={readOnly}
        height="100%"
        style={{ height: "100%" }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          autocompletion: false,
        }}
        placeholder={'Paste OpenUI Lang code, e.g.\n\nroot = Stack([title])\ntitle = TextContent("Hello")'}
      />
      {readOnly && <div className={styles.editorLock}>read-only during playback</div>}
    </div>
  );
}
