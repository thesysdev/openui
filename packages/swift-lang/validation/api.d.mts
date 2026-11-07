export interface LibrarySnapshot {
  id?: string;
  version?: string;
  root?: string;
  schema: Record<string, unknown>;
  components: Record<string, { signature: string; description?: string }>;
}
export interface ValidationReport {
  valid: boolean;
  mode: 'static';
  sourceSHA256: string;
  contract: { id: string | null; version: string | null; sdkCommit: string | null; schemaSHA256: string | null; librarySHA256: string | null };
  core: { upstream: string; sourceTree: string; sha256: string };
  root: { typeName: string; partial: boolean; statementId?: string } | null;
  hasRootExpression: boolean;
  errorCount: number;
  warningCount: number;
  meta: {
    incomplete: boolean;
    unresolved: string[];
    orphaned: string[];
    errors: Array<{ code: string; component: string; path: string; message: string; statementId?: string; severity?: 'warning' }>;
    [key: string]: unknown;
  };
  signatures: Record<string, string>;
}
export interface ValidatorOptions {
  runtimeDirectory?: string;
  timeoutMs?: number;
}
export function createValidator(options: ValidatorOptions & { schema: Record<string, unknown>; library: LibrarySnapshot; manifest?: Record<string, any> }): { validate(source: string): ValidationReport };
export function loadValidator(options: ValidatorOptions & { contractDirectory: string }): { validate(source: string): ValidationReport };
export function sha256(data: string | Uint8Array): string;
export class ValidatorError extends Error { readonly code: string; }
