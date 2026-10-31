// Oracle must be the upstream lang-core module, never the Swift implementation.
// node generate-semantic-fixtures.mjs /path/to/main/lang-core.mjs [upstream-main-sha] [module-source-sha]
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
const modulePath = path.resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('Supply a compiled upstream TypeScript lang-core module');
const core = await import(pathToFileURL(modulePath));
const units = text => Array.from({length:text.length},(_,i)=>text.charCodeAt(i));
function canonical(value) {
 if(value===undefined) return {undefined:true};
 if(typeof value==='string') return {utf16:units(value)};
 if(typeof value==='number' && (!Number.isFinite(value)||Object.is(value,-0))) return {number:Object.is(value,-0)?'-0':String(value)};
 if(Array.isArray(value)) return {array:value.map(canonical)};
 if(value && typeof value==='object') return {object:Object.entries(value).map(([key,value])=>[units(key),canonical(value)])};
 return value;
}
const item={n:1}, a=[item], b=[{n:1}], object={n:1};
const state={$a:a,$alias:a,$b:b,$item:item,$obj:object,$objAlias:object,$hi:'\ud800',$lo:'\udc00',$keys:{'\ud800':'\udc00','é':1,'e\u0301':2}};
const mutation={status:'idle'};
const ctx={getState:name=>state[name]??null,resolveRef:name=>name==='query'?a:name==='mutation'?mutation:null,
 functions:{Identity:{params:{type:'object',properties:{value:{}},required:['value']},fn:({value})=>value},Clone:{params:{type:'object',properties:{value:{}},required:['value']},fn:({value})=>[...value]}}};
const expressions=[
 '$a == $a','$a == $alias','$a == $b','$obj == $objAlias','$obj == {n:1}','[] == []','{} == {}',
 '$a[0] == $item','@First($a) == $item','@Last($a) == $item','@Identity($a) == $a','@Clone($a) == $a',
 '@Sort($a,"n") == $a','@First(@Sort($a,"n")) == $item','$a.n == $a.n',
 '@Count(@Filter($a,"","==",$item))','@Count(@Filter($a,"","==",{n:1}))',
 '@First(@Each($a,"x",x)) == $item','@Each($a,"x",x == x)','@First(@Each($a,"x",x.n)) == 1','@Each($a,"x",@First($a) == $item)','@First(@Each($a,"x",{original:$item})).original == $item',
 'query == query','query == $a','mutation == mutation','mutation == {status:"idle"}',
 '"😀".length','"😀"[0]','"😀"[1]','"😀".0','"😀".1','"😀"[2]',
 '$hi + $lo','($hi + $lo).length','($hi + $lo)[0]','$hi == "\uD800"','$hi == "�"',
 '"é" == "e\u0301"','"e\u0301".length','$keys["\uD800"]','$keys["é"]','$keys["e\u0301"]',
 '"a" + $hi','[$hi,$lo] + ""','@Sum([1,2])','"\uD800" ? true : false',
 '"\uD800" == 0','"12\uD800" - 0','"\uFEFF12\u00A0" - 0','"😀" < "\uE000"',
];
const vectors=expressions.map((text,i)=>{ const expression=text.replace(/[\uD800-\uDFFF]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')); return {kind:'expression',id:`identity-utf16-${i}`,expression,expected:canonical(core.evaluate(core.parseExpression(core.tokenize(expression)),ctx))}; });
const patterns=['','^$','^.$','^..$','^...$','.','..','^😀$','^[😀]$','^😀+$','^[^😀]$','^\\uD800$','^\\uDC00$','^\\uD83D\\uDE00$','^\\u{1F600}$','^\\0$','^[\\s]+$','^\\S+$','^\\w+$','^\\W+$','^\\d+$','^\\D+$','a$','^a$','^a.*$','^a[\\s\\S]*$','a|😀','^(a|😀)+$','^(?:ab)?$','^a{1,3}$','^a{2,}$','\\bword\\b','[a-z]','[^a-z]','[é]','^é$','^e\u0301$','[\ud800-\udfff]','\ud800','\udc00','\0','[','(','a{3,2}','\\','(?=a)a','(a)\\1','(?<=a)b','(?<x>a)\\k<x>','\\p{L}','[\\b]','a$|b$','^a\\n$'];
const inputs=['','a','aa','aaa','aaaa','ab','b','word','a word!','a\n','a\r','a\r\n','a\u2028','a\u2029','😀','😀😀','\ud800','\udc00','\ud83d','\ude00','\ud83d\ude00\ude00','\0','\b','é','e\u0301','123','１２','_a',' ','\t\n','\u00a0','\ufeff','\u200b','\u2028','\u2029'];
for(const [p,pattern]of patterns.entries())for(const [v,value]of inputs.entries()){
 let expected;try{expected=new RegExp(pattern).test(value)?'matches':'noMatch'}catch{expected='invalidPattern'}
 vectors.push({kind:'regexp',id:`regexp-${p}-${v}`,pattern,value,expected});
}
const store=core.createStore(), first={n:1}, second={n:1};
store.set('$first',first,false);store.set('$second',second,false);store.set('$second',first,false);
vectors.push({kind:'stateAlias',id:'state-alias-write',expectedRef:store.get('$second')===first,specExpected:true,referenceDefect:'store.set shallow-compares plain objects; protocol object identity requires installing the supplied reference.'});
const metadata={reference:process.argv[3]??'9823ec05d4b29bc78d101676dc16b44fe17f1830',moduleSource:process.argv[4]??process.argv[3]??'9823ec05d4b29bc78d101676dc16b44fe17f1830',moduleSha256:createHash('sha256').update(fs.readFileSync(modulePath)).digest('hex'),node:process.version,v8:process.versions.v8,unicode:process.versions.unicode,regexp:'new RegExp(pattern).test(value), no flags',vectors};
const target=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../Tests/OpenUILangTests/Fixtures/semantic-vectors.json');
fs.writeFileSync(target,JSON.stringify(metadata,null,2)+'\n');
console.log(`${expressions.length} expression, ${patterns.length*inputs.length} regexp, 1 normative state-alias vector; Node ${process.version}, V8 ${process.versions.v8}`);
