// Independent oracle: no Swift compatibility/readiness plugin is applied to it.
import {build, transform} from 'esbuild';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {serializer} from './compat.mjs';

const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../..');
const manifest=JSON.parse(readFileSync(join(here,'../Sources/OpenUILang/Resources/core-manifest.json')));
assert.equal(execFileSync('git',['rev-parse','HEAD:packages/lang-core'],{cwd:root,encoding:'utf8'}).trim(),manifest.sourceTree);
execFileSync('git',['diff','--quiet','HEAD','--','packages/lang-core'],{cwd:root});
const temporary=mkdtempSync(join(tmpdir(),'openui-oracle-'));
const sha=value=>createHash('sha256').update(value).digest('hex');
process.env.OPENUI_RUNTIME_TELEMETRY_ENABLED='0';
try {
  const modulePath=join(temporary,'official.mjs');
  await build({absWorkingDir:root,entryPoints:['packages/lang-core/src/index.ts'],outfile:modulePath,bundle:true,platform:'node',format:'esm',minifyWhitespace:true,legalComments:'none',nodePaths:[join(here,'node_modules')],external:['ci-info'],logLevel:'silent'});
  const official=await import(pathToFileURL(modulePath));
  const realm=vm.createContext({__utf8Encode:x=>[...Buffer.from(x)],__utf8Decode:x=>Buffer.from(x).toString('utf8'),setInterval,clearInterval});
  vm.runInContext(readFileSync(join(here,'../Sources/OpenUILang/Resources/lang-core.js'),'utf8'),realm);
  const native=realm.SwiftCore.api;
  const canonicalSource=`function canonical(value) {
    if(value===undefined)return {undefined:true};
    if(typeof value==='number'&&(!Number.isFinite(value)||Object.is(value,-0)))return {number:String(value),negativeZero:Object.is(value,-0)};
    if(!value||typeof value!=='object')return value;
    if(Array.isArray(value))return {array:Array.from(value,canonical)};
    if(Object.prototype.toString.call(value)==='[object Map]')return {map:Array.from(value,([k,v])=>[canonical(k),canonical(v)])};
    const metadata=['native.source.syntax','native.source.memo','native.source.path'];
    return {object:Reflect.ownKeys(value).filter(k=>Object.prototype.propertyIsEnumerable.call(value,k)&&!(typeof k==='symbol'&&metadata.includes(k.description))).map(k=>[typeof k==='symbol'?{symbol:k.description}:k,canonical(value[k])])};
  }`;
  const canonical=vm.runInNewContext('('+canonicalSource+')');
  const digest=value=>JSON.stringify(canonical(value));
  const schema={
    $defs:{Box:{type:'object',properties:{value:{}},required:['value']},Stack:{type:'object',properties:{children:{}},required:['children']},Button:{type:'object',properties:{label:{},action:{}},required:['label']}},
    properties:{Box:{$ref:'#/$defs/Box'},Stack:{$ref:'#/$defs/Stack'},Button:{$ref:'#/$defs/Button'}},
    actions:{Notify:{params:{type:'object',properties:{code:{type:'string'}},required:['code']}}},
  };
  const library={components:{},toJSONSchema:()=>schema};
  const programs=[
    ['string',['root=Box("hel','lo")']],
    ['arguments',['root=Stack([Box(1),','Box({a:2,b:[true,','null]})])']],
    ['reference',['root=Box(label)\n','label="ready','"\n']],
    ['action',['$n=1\nroot=Button("Go",Action([@Set($n,','2),@ToAssistant("sa','ved")]))']],
    ['unicode',['root=Box("😀 ','é")']],
    ['unknown',['root=Box(missing)']],
    ['typed-error',['root=Unknown(1)']],
    ['query',['q=Query("load",{id:1},[])\n','root=Box(q)']],
    ['replacement',['root=Box("old")\n','root=Box("new','")']],
    ['truncated-final',['root=Button("Go",@OpenUrl("https://example.test/rea']],
  ];
  let comparisons=0;const fixtures=[];
  for(const [id,chunks] of programs) {
    const a=official.createStreamingParser(schema),b=native.createStreamingParser(schema),operations=[];
    const record=(kind,text,complete,x,y)=>{
      const expected=digest(x);assert.equal(digest(y),expected,id+':'+kind);comparisons++;
      operations.push({kind,text,complete,expected});
    };
    for(const text of chunks)record('push',text,false,a.push(text),b.push(text));
    record('complete','',true,a.getResult(true),b.getResult(true));
    record('set','root=Box("replacement")',true,a.set('root=Box("replacement")',true),b.set('root=Box("replacement")',true));
    const source=chunks.join('');
    record('batch',source,true,official.createParser(schema).parse(source),native.createParser(schema).parse(source));
    fixtures.push({id,operations});
  }
  // Execute the pinned official framework's callback verbatim with controlled
  // host dependencies. No replica action interpreter is used as the oracle.
  const adapterPath='packages/react-lang/src/hooks/useOpenUIState.ts';
  const adapter=execFileSync('git',['show',manifest.upstream+':'+adapterPath],{cwd:root,encoding:'utf8'});
  const section=adapter.slice(adapter.indexOf('  const triggerAction = useCallback('),adapter.indexOf('  // ─── reportError'));
  assert.ok(section.includes('case ACTION_STEPS.Set:'));
  const factoryTS='export function createAction(args:any){const {bundleBlocked,propsRef,schema,getFormPayload,queryManager,evaluationContext,resultRef,store,evaluate,ACTION_STEPS,BuiltinActionType}=args;const useCallback=(f:any)=>f;'+section+'return triggerAction;}';
  const transformed=await transform(factoryTS,{loader:'ts',format:'esm'});
  const {createAction}=await import('data:text/javascript;base64,'+Buffer.from(transformed.code).toString('base64'));
  const actions=[];
  for(const [id,body,toolOutcome] of [
    ['set-reset','Action([@Set($n,$n+2),@ToAssistant("saved",{n:$n}),@Reset($n)])','success'],
    ['url-custom','Action([@OpenUrl("https://example.test"),@Notify("accepted")])','success'],
    ['mutation-success','Action([@Run(m),@ToAssistant("saved")])','success'],
    ['mutation-failure','Action([@Run(m),@Set($n,99),@ToAssistant("saved")])','failure'],
    ['mutation-cancel','Action([@Run(m),@Set($n,99),@ToAssistant("saved")])','cancel'],
  ]) {
    const source='$n=1\nm=Mutation("save",{id:7})\nroot=Button("Go",'+body+')';
    const parsed=official.createParser(schema).parse(source),store=official.createStore();
    store.initialize(parsed.stateDeclarations,{});
    const tools=[],events=[];let manager;
    manager=official.createQueryManager({callTool:async(name,args)=>{tools.push({name,args});if(toolOutcome==='cancel')manager.dispose();if(toolOutcome==='failure')throw Error('controlled failure');return {saved:true};}});
    manager.registerMutations([{statementId:'m',toolName:'save'}]);
    const ctx={getState:n=>store.get(n)??null,resolveRef:n=>n==='m'?manager.getMutationResult('m'):null,actions:schema.actions};
    const errors=[],tree=official.evaluateRoot(parsed,{ctx,library,store,errors});
    assert.equal(parsed.meta.errors.length+errors.length,0,id);
    const trigger=createAction({bundleBlocked:false,propsRef:{current:{onAction:e=>events.push(e)}},schema,getFormPayload:()=>store.getSnapshot(),queryManager:manager,evaluationContext:ctx,resultRef:{current:parsed},store,evaluate:official.evaluate,ACTION_STEPS:official.ACTION_STEPS,BuiltinActionType:official.BuiltinActionType});
    await trigger('Go',undefined,tree.props.action);
    actions.push({id,source,toolOutcome,events:digest(events),state:digest(store.getSnapshot()),tools:digest(tools)});
    manager.dispose();
  }
  const roundtrips=[];
  for(const expression of ['10-(3-1)','-(1+2)','{"a-b":1,"中文":2}','(true?1:2)+3','(8/2)/2','8/(2/2)']) {
    const ast=official.parseExpression(official.tokenize(expression));
    const tree={type:'element',typeName:'Box',props:{value:ast},statementId:'root',partial:false};
    const text=native.jsonToOpenUI(tree,library),parsed=official.createParser(schema).parse(text),errors=[];
    const ctx={getState:()=>null,resolveRef:()=>null};
    const result=official.evaluateRoot(parsed,{ctx,library,store:official.createStore(),errors});
    assert.equal(parsed.meta.errors.length+errors.length,0,text);
    assert.equal(digest(result.props.value),digest(official.evaluate(ast,ctx)),text);
    roundtrips.push({expression,text});
  }
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  async function queryTrace(core) {
    const pending=[],history=[],snapshots=[];
    const manager=core.createQueryManager({callTool:(name,args)=>{history.push({name,args});return new Promise(resolve=>pending.push(resolve));}});
    const node=id=>({statementId:'q',toolName:'load',args:{id},defaults:[],complete:true});
    manager.evaluateQueries([node(1)]);snapshots.push(digest(manager.getSnapshot()));
    pending.shift()({rows:['first']});await settle();snapshots.push(digest(manager.getSnapshot()));
    manager.evaluateQueries([node(2)]);snapshots.push(digest(manager.getSnapshot()));
    manager.dispose();pending.shift()({rows:['late']});await settle();snapshots.push(digest(manager.getSnapshot()));
    return {history:digest(history),snapshots};
  }
  const queries=await queryTrace(official);assert.deepEqual(await queryTrace(native),queries);
  const patchRoot=join(temporary,'patch-check'),serializerPath='packages/lang-core/src/parser/serialize.ts';
  mkdirSync(dirname(join(patchRoot,serializerPath)),{recursive:true});
  const serializerSource=readFileSync(join(root,serializerPath),'utf8');
  writeFileSync(join(patchRoot,serializerPath),serializerSource);
  execFileSync('git',['apply',join(here,'patches/serializer-roundtrip.patch')],{cwd:patchRoot});
  assert.equal(readFileSync(join(patchRoot,serializerPath),'utf8'),serializer(serializerSource),'Standalone patch must match the shipped build correction');
  assert.deepEqual(manifest.adaptations,JSON.parse(readFileSync(join(here,'adaptations.json'))));
  const contract={upstream:manifest.upstream,sourceTree:manifest.sourceTree,oracleSHA256:sha(readFileSync(modulePath)),officialActionSHA256:sha(section),canonicalSource,schema,fixtures,actions,queries,roundtrips};
  const fixtureFile=join(here,'../Tests/OpenUILangTests/Fixtures/strict-compatibility.json');
  if(process.argv.includes('--write'))writeFileSync(fixtureFile,JSON.stringify(contract)+'\n');
  else assert.deepEqual(JSON.parse(readFileSync(fixtureFile)),contract,'Oracle fixture drift: inspect source changes before regenerating');
  console.log(JSON.stringify({strictParserComparisons:comparisons,officialActionTraces:actions.length,controlledQuerySnapshots:queries.snapshots.length,serializerRoundtrips:roundtrips.length,unexplainedDifferences:0}));
} finally {rmSync(temporary,{recursive:true,force:true});}
