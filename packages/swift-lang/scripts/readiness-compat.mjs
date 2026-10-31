import { replaceOnce } from './compat.mjs';
export function readiness(source, kind, path) {
  const imports = `import {tokenComplete as nativeTokenComplete,tagSyntax as nativeTagSyntax,tagReady as nativeTagReady,sourceComplete as nativeSourceComplete,astComplete as nativeASTComplete,finishEvaluation as nativeFinishEvaluation} from ${JSON.stringify(path)};\n`;
  if (kind === 'lexer') {
    source = replaceOnce(source, 'tokenize(src: string): Token[]', 'tokenize(src: string, sourceLength = src.length): Token[]');
    source = source.replaceAll('tokens.push(', 'nativePush(');
    source = replaceOnce(source, '  const n = src.length;', `  const n = src.length;
  const nativePush = (token:Token) => {
    const closing = [T.RParen,T.RBrack,T.RBrace].includes(token.t);
    nativeTagSyntax(token, closing ? i < sourceLength : token.t === T.Str ? i <= sourceLength : true);
    tokens.push(token);
  };`);
  } else if (kind === 'expressions') {
    source = replaceOnce(source, '  let pos = 0;', `  let pos = 0;
  const nativeIncomplete = [0];
  for (const token of tokens) nativeIncomplete.push(nativeIncomplete[nativeIncomplete.length-1] + (nativeTokenComplete(token) ? 0 : 1));`);
    source = replaceOnce(source, 'function parseExpr(minPrec: number = 0): ASTNode {', 'function parseExpr(minPrec: number = 0): ASTNode {\n    const nativeStart = pos;');
    source = replaceOnce(source, '    return left;\n  }\n\n  // ── Prefix', '    return nativeTagSyntax(left, nativeIncomplete[Math.min(nativeStart,tokens.length)] === nativeIncomplete[Math.min(pos,tokens.length)]);\n  }\n\n  // ── Prefix');
  } else if (kind === 'parser') {
    source = replaceOnce(source, 'split(tokenize(text))', 'split(tokenize(text, trimmed.length))');
    source = replaceOnce(source, 'split(tokenize(closed))', 'split(tokenize(closed, pendingText.length))');
    source = replaceOnce(source, `      if (completedStmtMap.has(s.id) && wasIncomplete) continue;
      const expr = parseExpression(s.tokens);`, `      if (completedStmtMap.has(s.id) && wasIncomplete) continue;
      const expr = parseExpression(s.tokens);
      if (!complete) nativeTagSyntax(expr, false);`);
  } else if (kind === 'materialize') {
    source = replaceOnce(source, 'return nativeBudget(ctx,()=>nativeMaterializeValue(node,ctx),null);', 'return nativeTagReady(nativeBudget(ctx,()=>nativeMaterializeValue(node,ctx),null),nativeASTComplete(node,ctx));');
    source = replaceOnce(source, 'return nativeBudget(ctx,()=>nativeMaterializeExpr(node,ctx,scopedRefs),{k:"Null"});', 'return nativeTagReady(nativeBudget(ctx,()=>nativeMaterializeExpr(node,ctx,scopedRefs),{k:"Null"}),nativeASTComplete(node,ctx,scopedRefs));');
  } else if (kind === 'evaluator') {
    source = replaceOnce(source, '): unknown {\n  switch (node.k) {', '): unknown {\n  return nativeFinishEvaluation(node, nativeSourceEvaluate(node,context,schemaCtx));\n}\nfunction nativeSourceEvaluate(node:ASTNode,context:EvaluationContext,schemaCtx?:SchemaContext):unknown {\n  switch (node.k) {');
    source = replaceOnce(source, '  return { ...el, props: evaluated };', '  return nativeTagReady({ ...el, props: evaluated }, nativeSourceComplete(el));');
  } else if (kind === 'evaluate-tree') {
    source = replaceOnce(source, '  return { ...el, props: evaluated };', '  return nativeTagReady({ ...el, props: evaluated }, nativeSourceComplete(el));');
  }
  return imports + source;
}
