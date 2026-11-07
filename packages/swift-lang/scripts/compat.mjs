// Temporary shared-core defect corrections and execution budgets only.
// Every replacement is checked against the pinned source; upgrades must review it.
export function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2)
    throw Error(
      'Pinned compatibility patch no longer matches: ' + before.slice(0, 90),
    );
  return source.replace(before, after);
}
export function serializer(source) {
  const patches = [
    ['_side: "left" | "right",', 'side: "left" | "right",'],
    [
      'if (child.k !== "BinOp") return inner;',
      'if (child.k === "Ternary" || child.k === "Assign") return `(${inner})`;\n  if (child.k !== "BinOp") return inner;',
    ],
    [
      'if (childPrec < parentPrec) return `(${inner})`;',
      'if (childPrec < parentPrec || (side === "right" && childPrec === parentPrec)) return `(${inner})`;',
    ],
    [
      'return `${node.op}${serializeASTNode(node.operand, calls)}`;',
      'return `${node.op}${tight(node.operand, calls)}`;',
    ],
    [
      'return `${serializeASTNode(node.cond, calls)} ? ${serializeASTNode(node.then, calls)} : ${serializeASTNode(node.else, calls)}`;',
      'return `${node.cond.k === "Ternary" || node.cond.k === "Assign" ? "(" + serializeASTNode(node.cond, calls) + ")" : serializeASTNode(node.cond, calls)} ? ${serializeASTNode(node.then, calls)} : ${serializeASTNode(node.else, calls)}`;',
    ],
    [
      'return `${serializeASTNode(node.obj, calls)}.${node.field}`;',
      'return `${tight(node.obj, calls)}[${JSON.stringify(node.field)}]`;',
    ],
    [
      'return `${serializeASTNode(node.obj, calls)}[${serializeASTNode(node.index, calls)}]`;',
      'return `${tight(node.obj, calls)}[${serializeASTNode(node.index, calls)}]`;',
    ],
    [
      '`${k}: ${serializeASTNode(v, calls)}`',
      '`${key(k)}: ${serializeASTNode(v, calls)}`',
    ],
    [
      '`${k}: ${serializeValue(v, paramMap, collector)}`',
      '`${key(k)}: ${serializeValue(v, paramMap, collector)}`',
    ],
  ];
  for (const [before, after] of patches)
    source = replaceOnce(source, before, after);
  return (
    source +
    '\nfunction key(k:string){return /^[A-Za-z_][A-Za-z0-9_]*$/.test(k)?k:JSON.stringify(k);}\nfunction tight(n:ASTNode,c:ReadonlyMap<string,CallDef>){const text=serializeASTNode(n,c);return ["BinOp","UnaryOp","Ternary","Assign"].includes(n.k)?"("+text+")":text;}\n'
  );
}
export function materializer(source) {
  source = replaceOnce(
    source,
    'export function materializeValue(node: ASTNode, ctx: MaterializeCtx): unknown {',
    `export function materializeValue(node: ASTNode, ctx: MaterializeCtx): unknown {
  return nativeBudget(ctx,()=>nativeMaterializeValue(node,ctx),null);
}
function nativeMaterializeValue(node: ASTNode, ctx: MaterializeCtx): unknown {`,
  );
  source = replaceOnce(
    source,
    `): ASTNode {
  switch (node.k) {`,
    `): ASTNode {
  return nativeBudget(ctx,()=>nativeMaterializeExpr(node,ctx,scopedRefs),{k:"Null"});
}
function nativeMaterializeExpr(node:ASTNode,ctx:MaterializeCtx,scopedRefs:ReadonlySet<string>):ASTNode {
  switch (node.k) {`,
  );
  return (
    source +
    `
function nativeBudget<T>(ctx:MaterializeCtx,body:()=>T,fallback:T):T {
 const state=ctx as MaterializeCtx & {nativeDepth?:number,nativeNodes?:number,nativeLimit?:boolean};
 state.nativeDepth=(state.nativeDepth??0)+1;state.nativeNodes=(state.nativeNodes??0)+1;
 try{
  if(state.nativeDepth>256||state.nativeNodes>100000){
   if(!state.nativeLimit){state.nativeLimit=true;ctx.errors.push({source:"parser",code:"parse-exception",message:"Materialization limit exceeded (256 levels or 100000 nodes).",statementId:ctx.currentStatementId});}
   return fallback;
  }
  return body();
 }finally{state.nativeDepth--;}
}
`
  );
}
