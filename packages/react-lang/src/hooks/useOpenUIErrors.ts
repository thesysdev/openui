import {
  enrichErrors,
  type OpenUIError,
  type ParseResult,
  type QuerySnapshot,
} from "@openuidev/lang-core";
import { useEffect, useRef, useState } from "react";
import type { Library } from "../library";

type CurrentRef<T> = { current: T };

export interface OpenUIErrorsResult {
  errorsRef: CurrentRef<OpenUIError[]>;
  errorRevision: number;
}

export interface UseOpenUIErrorsOptions {
  response: string | null;
  isStreaming: boolean;
  result: ParseResult | null;
  evaluatedResult: ParseResult | null;
  library: Library;
  querySnapshot: QuerySnapshot;
  parseExceptionRef: CurrentRef<OpenUIError | null>;
  runtimeErrorsRef: CurrentRef<OpenUIError[]>;
  renderErrorsRef: CurrentRef<OpenUIError[]>;
  onError?: (errors: OpenUIError[]) => void;
}

/** Aggregates Renderer errors and owns the public onError callback behavior. */
export function useOpenUIErrors({
  response,
  isStreaming,
  result,
  evaluatedResult,
  library,
  querySnapshot,
  parseExceptionRef,
  runtimeErrorsRef,
  renderErrorsRef,
  onError,
}: UseOpenUIErrorsOptions): OpenUIErrorsResult {
  const errorsRef = useRef<OpenUIError[]>([]);
  const [errorRevision, setErrorRevision] = useState(0);
  const lastErrorKeyRef = useRef("");
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (isStreaming) {
      errorsRef.current = [];

      // Clear stale errors so correction-loop consumers receive a clean signal
      // while the next response is being generated.
      if (lastErrorKeyRef.current !== "") {
        lastErrorKeyRef.current = "";
        onErrorRef.current?.([]);
      }
      return;
    }

    const errors: OpenUIError[] = [];

    if (parseExceptionRef.current) {
      errors.push(parseExceptionRef.current);
    }

    // A missing or unusable entry is reported by the parser as `no-root`.
    if (response && !result?.meta.statementCount && !parseExceptionRef.current) {
      errors.push({
        source: "parser",
        code: "parse-failed",
        message: "Response could not be parsed as valid openui-lang",
        hint: `The entire response must be valid openui-lang code starting with root = ${library.root ?? "Root"}(...)`,
      });
    }

    if (result?.meta.errors.length) {
      errors.push(
        ...enrichErrors(
          result.meta.errors,
          library.toJSONSchema(),
          Object.keys(library.components),
        ),
      );
    }

    errors.push(...runtimeErrorsRef.current);
    errors.push(...renderErrorsRef.current);
    renderErrorsRef.current = [];
    errors.push(...(querySnapshot.__openui_errors ?? []));
    errorsRef.current = errors;

    const errorKey = JSON.stringify(errors);
    if (errorKey === lastErrorKeyRef.current) return;

    lastErrorKeyRef.current = errorKey;
    setErrorRevision((revision) => revision + 1);
    if (onErrorRef.current) {
      onErrorRef.current(errors);
    } else if (errors.length > 0) {
      for (const error of errors) {
        console.warn(`[openui] ${error.source}/${error.code}: ${error.message}`);
      }
    }
  }, [
    isStreaming,
    response,
    result,
    evaluatedResult,
    querySnapshot,
    library,
    parseExceptionRef,
    runtimeErrorsRef,
    renderErrorsRef,
  ]);

  return { errorsRef, errorRevision };
}
