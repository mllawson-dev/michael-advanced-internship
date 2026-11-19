import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
async function moduleWith(path, dependencies, extra = '') {
 const source = readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^import .*from ["'].*["'];\s*$/gm, '');
 const prelude = `const { ${Object.keys(dependencies).join(', ')} } = globalThis.__libraryTest;\n`;
 const compiled = ts.transpileModule(prelude + source + extra, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
 globalThis.__libraryTest = dependencies;
 return import('data:text/javascript;base64,' + Buffer.from(compiled + '\n//' + Math.random()).toString('base64'));
}
function store() {
 const rows = new Map(); const paths = [];
 const db = {
  async runTransaction(fn) {return fn({
   get:async ref=>({exists:rows.has(ref.key),data:()=>rows.get(ref.key)}),
   set:(ref,data)=>rows.set(ref.key,{...rows.get(ref.key),...data}),
   delete:ref=>rows.delete(ref.key),
  });},
  collection(name) {return {doc(uid) {return {collection(child) {
   const prefix = `${name}/${uid}/${child}/`;paths.push(prefix);
   function query(after='', limit=Infinity) {return {
    orderBy(){return this;},startAfter(cursor){return query(cursor,limit);},limit(count){return query(after,count);},
    async get(){const docs=[...rows].filter(([key])=>key.startsWith(prefix)&&key.slice(prefix.length)>after).sort(([a],[b])=>a<b?-1:a>b?1:0).slice(0,limit).map(([key,data])=>({id:key.slice(prefix.length),data:()=>data}));return {size:docs.length,docs};},
    doc(id){return {key:prefix+id,async set(data){rows.set(prefix+id,{...rows.get(prefix+id),...data});}};},
   };}
   return query();
  } };} };},
 };
 return {rows,paths,db};
}
const book = {id:'book1',title:'Book',author:'Author',imageLink:'cover',subscriptionRequired:false};
const req = (body, uid='alice') => new Request('http://localhost/api/library', {method:body?'POST':'GET',headers:{authorization:uid,origin:'http://localhost'},...(body?{body:JSON.stringify(body)}:{})});
function deps(db) {return {FieldPath:{documentId:()=>"__name__"},database:()=>db,identity:async request=>{const uid=request.headers.get('authorization');if(!uid)throw Error();return {uid};},origin:request=>{if(request.headers.get('origin')!=='http://localhost')throw Error();},loadBookDetails:async()=>({status:'success',book})};}
test('library reads and writes only verified identity, ignoring supplied uid and metadata',async()=>{
 const {rows,db}=store();rows.set('libraries/bob/books/private',{...book,id:'private',saved:true});
 const {GET,POST}=await moduleWith('../app/api/library/route.ts',deps(db));
 assert.deepEqual((await (await GET(req())).json()).books,[]);
 assert.equal((await POST(req({id:'book1',action:'save',uid:'bob',title:'forged'}))).status,200);
 assert.equal(rows.get('libraries/alice/books/book1').title,'Book');
 assert.equal(rows.get('libraries/bob/books/private').saved,true);
 assert.equal(rows.has('libraries/bob/books/book1'),false);
 assert.equal((await (await GET(req())).json()).books.length,1);
 assert.equal((await GET(req(undefined,''))).status,403);
});
test('independent saved and finished flags survive finishing, removing, resaving and repeated ended events',async()=>{
 const {rows,db}=store();const {POST}=await moduleWith('../app/api/library/route.ts',deps(db));
 for(const action of ['save','finish','finish','remove']) assert.equal((await POST(req({id:'book1',action}))).status,200);
 assert.equal(rows.get('libraries/alice/books/book1').saved,false);assert.equal(rows.get('libraries/alice/books/book1').finished,true);
 await POST(req({id:'book1',action:'save'}));assert.equal(rows.get('libraries/alice/books/book1').finished,true);
});
test('identity, origin, invalid identifiers, actions and missing book failures prevent writes',async()=>{
 for(const fail of ['identity','origin','id','action','book']) {
  let writes=0;const dependency=deps({collection(){writes++;throw Error();}});
  if(fail==='identity')dependency.identity=async()=>{throw Error();};
  if(fail==='origin')dependency.origin=()=>{throw Error();};
  if(fail==='book') {dependency.database=()=>({collection:()=>({doc:()=>({collection:()=>({doc:()=>({set:async()=>{writes++;}})})})})});dependency.loadBookDetails=async()=>({status:'empty'});}
  const {POST}=await moduleWith('../app/api/library/route.ts',dependency);
  assert.equal((await POST(req({id:fail==='id'?'../other':'book1',action:fail==='action'?'unknown':'save'}))).status,403);assert.equal(writes,0);
 }
});
test('native audio ended records completion; playback and time updates do not',async()=>{
 const calls=[];const React={createElement:(type,props,...children)=>({type,props:{...props,children}})};
 const {AudioPlayer}=await moduleWith('../app/components/player-preview.tsx',{React,useAuth:()=>({user:{uid:'alice'}}),useRef:()=>({current:false}),useState:value=>[value,()=>{}],BookCover:()=>null,libraryRequest:async(...args)=>calls.push(args)},'\nexport { AudioPlayer };');
 const tree=AudioPlayer({src:'audio',book});const audio=tree.props.children.find(child=>child?.type==='audio');
 audio.props.onPlay();audio.props.onTimeUpdate({currentTarget:{currentTime:12}});assert.equal(calls.length,0);
 audio.props.onEnded();await new Promise(resolve=>setImmediate(resolve));assert.equal(calls.length,1);assert.equal(calls[0][1],'finish');assert.equal(calls[0][2],'book1');
});

test('more than 500 records remain readable through bounded UID-scoped pages consumed by the client',async()=>{
 const {rows,db}=store();
 for(let i=0;i<625;i++){const id=`book${String(i).padStart(4,'0')}`;rows.set(`libraries/alice/books/${id}`,{...book,id,saved:true});}
 rows.set('libraries/bob/books/private',{...book,id:'private',saved:true});
 const {GET}=await moduleWith('../app/api/library/route.ts',deps(db));
 const fetchPage=async url=>{
  const result=await GET(new Request(`http://localhost${url}`,{headers:{authorization:'alice'}}));
  const page=await result.clone().json();assert.ok(page.books.length<=100);return result;
 };
 const originalFetch=globalThis.fetch;
 try {
  globalThis.fetch=fetchPage;
  const {libraryRequest}=await moduleWith('../app/lib/library.ts',{});
  const result=await libraryRequest({getIdToken:async()=> 'alice'});
  assert.equal(result.books.length,625);assert.equal(new Set(result.books.map(b=>b.id)).size,625);
  assert.equal(result.books.some(b=>b.id==='private'),false);
 } finally {globalThis.fetch=originalFetch;}
});
test('repeated removes of absent titles do not create tombstones; unfinished removes delete, finished removes retain completion',async()=>{
 const {rows,db}=store();const {POST}=await moduleWith('../app/api/library/route.ts',deps(db));
 for(let i=0;i<600;i++) await POST(req({id:`absent${i}`,action:'remove'}));
 assert.equal(rows.size,0);
 await POST(req({id:'book1',action:'save'}));await POST(req({id:'book1',action:'remove'}));assert.equal(rows.size,0);
 await POST(req({id:'book1',action:'finish'}));await POST(req({id:'book1',action:'remove'}));
 assert.equal(rows.get('libraries/alice/books/book1').finished,true);assert.equal(rows.get('libraries/alice/books/book1').saved,false);
});
