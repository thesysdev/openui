// Generate oracle data from the compiled TypeScript reference, never from Swift.
// Usage: node packages/swift-lang/scripts/generate-reference-fixtures.mjs /path/to/pinned/lang-core/dist/index.mjs /path/to/pinned/spec/fixtures/1.0
// Build that module from thesysdev/openui 8d9c4c3b108a7b5352192a6a9d7327bdf7ea19b5.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
if (!process.argv[2] || !process.argv[3]) throw new Error('Supply the pinned TypeScript module and fixture directory.');
const core=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const fixtureRoot=path.resolve(process.argv[3]);
const spec=JSON.parse(fs.readFileSync(path.join(fixtureRoot,'library.json'),'utf8'));
const schema=spec.schema;
const components=Object.fromEntries(Object.entries(spec.components).map(([name,{signature}])=>{
 const binding=new Set([...signature.matchAll(/(\w+)\??: \$binding</g)].map(m=>m[1]));
 return [name,{props:{shape:Object.fromEntries(Object.keys(schema.$defs[name].properties??{}).map(k=>{const s={};if(binding.has(k))core.markReactive(s);return [k,s]}))}}];
}));
const library={components,root:spec.root,toJSONSchema:()=>schema};
const functions=Object.fromEntries(Object.entries(schema.functions??{}).map(([name,def])=>[name,{...def,fn:({text})=>String(text??'').toUpperCase()}]));
const actionParams=Object.fromEntries(Object.entries(schema.actions??{}).map(([name,d])=>[name,Object.keys(d.params.properties??{})]));
function summary(v,ev){
 if(v==null||typeof v!=='object')return v??null;
 if(Array.isArray(v))return v.map(x=>summary(x,ev));
 if(v.type==='element')return {type:v.typeName,props:Object.fromEntries(Object.entries(v.props).map(([k,x])=>[k,summary(x,ev)]).filter(([,x])=>x!==null))};
 if(Array.isArray(v.steps))return {actions:v.steps.map(s=>{
  switch(s.type){
   case 'continue_conversation':return{action:'ToAssistant',args:s.context==null?[s.message]:[s.message,s.context]};
   case 'open_url':return{action:'OpenUrl',args:[s.url]};
   case 'set':return{action:'Set',args:[s.target,ev(s.valueAST)??null]};
   case 'reset':return{action:'Reset',args:s.targets};
   case 'run':return{action:'Run',args:[s.statementId]};
   default:return{action:s.name,args:(actionParams[s.name]??Object.keys(s.params??{})).map(k=>summary(s.params[k],ev))};
  }
 })};
 if(v.__reactive==='assign')return {$binding:v.target};
 return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,summary(x,ev)]));
}
function canonical(v){
 if(v===undefined)return {$undefined:true};
 if(typeof v==='number'&&!Number.isFinite(v))return {$number:String(v)};
 if(Array.isArray(v))return v.map(canonical);
 if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,canonical(x)]));
 return v;
}
function program(source,chunks){
 const parser=chunks?core.createStreamingParser(schema,spec.root):core.createParser(schema,spec.root);
 const result=chunks?(chunks.forEach((c,i)=>parser.push(c,i===chunks.length-1)),parser.getResult(true)):parser.parse(source);
 const store=core.createStore();store.initialize(result.stateDeclarations??{},{});
 const ctx={getState:n=>store.get(n)??null,resolveRef:n=>{const q=result.queryStatements.find(s=>s.statementId===n);if(q)return q.defaultsAST?core.evaluate(q.defaultsAST,ctx):null;return result.mutationStatements.some(s=>s.statementId===n)?{status:'idle',data:null,error:null}:null},functions,actions:schema.actions};
 const errors=[];const tree=core.evaluateRoot(result,{ctx,library,store,errors});
 return{root:summary(tree,ast=>core.evaluate(ast,ctx)),errors:[...result.meta.errors,...errors].map(({code,statementId})=>({code,...statementId?{statementId}:{}})),unresolved:result.meta.unresolved,orphans:result.meta.orphaned,incomplete:result.meta.incomplete,state:result.stateDeclarations??{}};
}
const vectors=[];
function addProgram(id,source){vectors.push({kind:'program',id,source,expected:JSON.parse(JSON.stringify(program(source)))});}
const expressions=[
 '[] ? "A" : "B"','{} ? "A" : "B"','"hello" == 0','"hello" != 0','"" == 0','"5" == 5','false == "0"','[] == ""','[1] == 1','{} == "[object Object]"','null == 0',
 '0x10','"0b101" + 0','"0o17" - 0','"0b101" - 0','-1 % 2','1 / 0','1 % 0','"a" + [1,2]','"a" + {}','"a" + null','"a" + 1e21','"a" + 0.000001',
 '@Count([1,2])','@First([])','@Last([1,2])','@Sum([1,"2",true,null])','@Filter([1,2,3], "", ">", 1)','@Sort(["10","2"], "")','@Round(-1.5)','@Round(2.55,1)',
 '[1,2][0]','[1,2][0.5]','[1,2][-1]','[1,2]["nope"]','"😀".length','"abc"[1]','[{},{}].x','{a:1,a:2}.a',
 '@Each([1,2], "x", Text(x))','@Each([1,2], "x", {value:x})','@Each([1], "x", Action([@ToAssistant("go", {n:x})]))',
];
for(const [i,expression]of expressions.entries()){
 const ctx={getState:()=>null,resolveRef:()=>null,functions,actions:schema.actions};
 const raw=core.evaluate(core.parseExpression(core.tokenize(expression)),ctx);
 function normalize(value){
  if(Array.isArray(value))return value.map(normalize);
  if(value&&typeof value==='object'&&(Array.isArray(value.steps)||value.type==='element'))return summary(value,ast=>core.evaluate(ast,ctx));
  return canonical(value);
 }
 const expected=normalize(raw);
 vectors.push({kind:'expression',id:'expression-'+i,expression,expected});
 if(typeof expected==='boolean')addProgram('boolean-'+i,`root = Stack([Text((${expression}) ? "A" : "B")])`);
}
for(const [i,expression]of ['[]','{}','""','"x"','0','1','null','[1]'].entries())addProgram('truthiness-'+i,`root = Stack([Text(${expression} ? "A" : "B")])`);
for(const [i,source]of [
 'root = Stack([@Each([1,2], "x", Text("row " + x))])',
 '$x = 1\nroot = Stack([Text("" + $x)])',
 '$x = 1 + 2\nroot = Stack([Text("" + $x)])',
 '$x = 2\nroot = $x > 1 ? Stack([Text("yes")]) : Stack([Text("no")])',
 'root = Stack([Text("\\uD83D\\uDE00")])',
 'root = Stack([Text("👨‍👩‍👧‍👦"), Text("é")])',
 'root = Stack([Text("a"), missing, Text("b")])',
 'root = Stack([])\nother = Text("orphan")',
 'root = Stack([Button("go", Action([@Set($x,2),@ToAssistant("saved",{id:1})]))])\n$x = 0',
 'root = Stack([Text("" + ({a:1,a:2}.a))])',
].entries())addProgram('program-'+i,source);
const messages=[
 '', 'plain', ']]>openui:content?library=travel%401.0&x=a+b\nroot = Stack([])\n]]>openui:context\n{"n":1}\n]]>openui:end',
 ']]>openui:content?foo=one&foo=two\na\n]]>openui:end',
 'a]]>openui:content\nb', ']]>openui:context\n{}',
 ']]>openui:content\na\n]]>openui:end\n]]>openui:content\nb',
 ']]>openui:content\na\n]]>openui:future\nhidden\n]]>openui:context\nnot-json',
 ']]>openui:content\r\na\r\n]]>openui:context\r\n{}\r\n]]>openui:end\r\n',
 'a]]>openui:con','a\n]]>openui:con','a\n]]>op','a\n]]>openui:end',
];
for(const [i,raw]of messages.entries())for(const streaming of [false,true])vectors.push({kind:'message',id:`message-${i}-${streaming}`,raw,streaming,expected:core.parseMessage(raw,{streaming})});
for(const value of [null,'',[],{},false,0,'😀','é','mailto:user@example.com','tel:123','https://example.com','12abc','  ','a@b.co']){
 for(const rules of [{required:true},{minLength:2},{maxLength:1},{url:true},{numeric:true},{min:5},{max:5},{email:true}])vectors.push({kind:'validation',id:`validation-${vectors.length}`,value,rules,expected:core.validate(value,core.parseStructuredRules(rules))??null});
}
for(const [i,[existing,patch]]of [
 ['root = Stack([a,b])\na = Text("a")\nb = Text("b")','a = Text("new")'],
 ['root = Stack([a])\na = Text("a")','a = null'],
 ['root = Stack([a])\na = Text("a")\na = Text("last")','root = Stack([a])'],
 ['a = Text("a")','b = Text("b")'],
 ['root = Stack([])\n$x = 1','root = Stack([])\n$x = null'],
].entries())vectors.push({kind:'merge',id:'merge-'+i,existing,patch,expected:core.mergeStatements(existing,patch)});
const target=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../Tests/OpenUILangTests/Fixtures');fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,'reference-vectors.json'),JSON.stringify({reference:'8d9c4c3b108a7b5352192a6a9d7327bdf7ea19b5',vectors},null,2)+'\n');

{
const file=path.join(target,"reference-vectors.json");
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const library=spec;
let id=0;
for(const toolCalls of [undefined,false,true])for(const bindings of [undefined,false,true])for(const builtinFunctions of [undefined,false,true])for(const tools of [undefined,['listTickets']]){
 const options=Object.fromEntries(Object.entries({toolCalls,bindings,builtinFunctions,tools}).filter(([,v])=>v!==undefined));
 data.vectors.push({kind:'prompt',id:'prompt-'+id++,library,options,expected:core.generateSystemPrompt({library,promptOptions:options})});
}
const grouped={...library,componentGroups:[{name:'Layout',components:['Stack','Card'],notes:['Keep containers compact.']},{name:'Details',components:['Text','Metric','Stack']}]};
for(const options of [
 {preamble:'Custom assistant.',examples:['root = Stack([])'],toolExamples:['q = Query("load",{}, {})'],additionalRules:['Be concise.'],editMode:true,inlineMode:true},
 {tools:[{name:'load',description:'Read rows.',inputSchema:{type:'object',properties:{limit:{type:'integer'},status:{type:'string',enum:['open','closed']}},required:['limit']},outputSchema:{type:'object',properties:{rows:{type:'array'},total:{type:'number'},ok:{type:'boolean'}}}}]},
 {toolCalls:false,bindings:false,builtinFunctions:false},
])data.vectors.push({kind:'prompt',id:'prompt-'+id++,library:grouped,options,expected:core.generateSystemPrompt({library:grouped,promptOptions:options})});
for(const expression of ['"é" == "é"','"a" + 1e20','"a" + -0','"a" + 1e-7','[1,2][1e999]','"😀".length','{a:1}["missing"]','"0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" - 0']){
 let result=core.evaluate(core.parseExpression(core.tokenize(expression)),{getState:()=>null,resolveRef:()=>null});
 if(result===undefined)result={$undefined:true};
 else if(typeof result==='number'&&!Number.isFinite(result))result={$number:String(result)};
 data.vectors.push({kind:'expression',id:'edge-'+id++,expression,expected:result});
}
for(const value of [{value:'',componentType:'input'},{value:[],componentType:'select'},'http:','http://a b','https://example.com','file:///tmp/data','mailto:a@b.co']){
 const rules={required:true,url:true};
 data.vectors.push({kind:'validation',id:'wrapped-'+id++,value,rules,expected:core.validate(value,core.parseStructuredRules(rules))??null});
}

for (const [i,source] of [
 '$text = 3\nroot = Stack([Text(@Upper($text))])',
 '$text = 3\nroot = Stack([Button("Copy", @CopyToClipboard($text))])',
 '$text = "okay"\nroot = Stack([Button("Copy", @CopyToClipboard($text))])',
 '$x = 1\nroot = Stack([Text($x = $value + 1)])',
 '$x = 1\nroot = Stack([Input("name", null, $x = $value + 1)])',
].entries()) data.vectors.push({kind:'program',id:'runtime-extra-'+i,source,expected:JSON.parse(JSON.stringify(program(source)))});
for(const raw of [']]>openui:content?x=%FF+foo\nroot = Stack([])',']]>openui:content?=empty&x=a%2Bb&y=a+b\nroot = Stack([])'])
 data.vectors.push({kind:'message',id:'message-extra-'+id++,raw,expected:core.parseMessage(raw)});
for(const value of [1,'abc','😀'])for(const rules of [{min:true},{max:'bad'},{minLength:[]},{maxLength:{}},{min:'0x10'}])
 data.vectors.push({kind:'validation',id:'rules-extra-'+id++,value,rules,expected:core.validate(value,core.parseStructuredRules(rules))??null});
// The protocol takes precedence over this confirmed defect in the pinned TS merge.
const duplicate=data.vectors.find(v=>v.id==='merge-2');
duplicate.specExpected='root = Stack([a])\na = Text("last")';
duplicate.referenceDefect='language.md section 7 requires each name once; the pinned TS merge repeats an existing duplicate.';
// Share repeated library documents and prompt strings to keep the fixture reviewable.
const libraries={}, promptExpectations={};
const libraryKeys=new Map(), promptKeys=new Map();
for(const vector of data.vectors)if(vector.kind==='prompt'){
 const serialized=JSON.stringify(vector.library);
 let key=libraryKeys.get(serialized);
 if(!key){key='library-'+libraryKeys.size;libraryKeys.set(serialized,key);libraries[key]=vector.library;}
 vector.library=key;
 let expectedKey=promptKeys.get(vector.expected);
 if(!expectedKey){expectedKey='prompt-'+promptKeys.size;promptKeys.set(vector.expected,expectedKey);promptExpectations[expectedKey]=vector.expected;}
 vector.expectedRef=expectedKey;delete vector.expected;
}
data.libraries=libraries;data.promptExpectations=promptExpectations;
fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
console.log('Pinned TypeScript oracle vectors:',data.vectors.length,'including one explicit normative exception.');

}
