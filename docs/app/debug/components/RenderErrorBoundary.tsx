"use client";

import { Button } from "@openuidev/react-ui";
import styles from "@paste/paste.module.css";
import { Component, type ReactNode } from "react";

interface Props {
  /** Bump to clear the error state (e.g. when the code or version changes). */
  resetKey: string;
  /** Card headline, e.g. "Renderer crashed" or "Output panel crashed". */
  title?: string;
  /** Extra context line shown under the error message. */
  hint?: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
  lastResetKey: string;
}

export class RenderErrorBoundary extends Component<Props, State> {
  state: State = { error: null, lastResetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.lastResetKey) {
      return { error: null, lastResetKey: props.resetKey };
    }
    return null;
  }

  render() {
    if (this.state.error) {
      return (
        <div className={styles.renderCrash}>
          <strong>{this.props.title ?? "Renderer crashed"}</strong>
          <pre>{this.state.error.message}</pre>
          {this.props.hint && <p>{this.props.hint}</p>}
          <Button variant="secondary" size="small" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
