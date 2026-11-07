const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx=vm.createContext({console});
vm.runInContext(fs.readFileSync(__dirname+'/../tools/ContractIntegration.js','utf8'),ctx);
function fixture(){return {
 'xl/workbook.xml':'<workbook xmlns:r="rel"><sheets><sheet name="Fechas cerradas 2027 por fecha " sheetId="1" r:id="rId4"/><sheet name="Balance" sheetId="5" r:id="rId8"/></sheets><definedNames/><calcPr/></workbook>',
 'xl/_rels/workbook.xml.rels':'<Relationships><Relationship Id="rId4" Target="worksheets/sheet1.xml"/><Relationship Id="rId8" Target="worksheets/sheet2.xml"/></Relationships>',
 '[Content_Types].xml':'<Types></Types>',
 'xl/worksheets/sheet1.xml':'<worksheet><sheetData><row r="3"><c r="C3" s="8"/></row><row r="5"><c r="C5" s="2"/><c r="D5" s="3"/><c r="H5" s="4"/><c r="Q5"><f>SUM(H5:P5)</f><v>0</v></c></row></sheetData></worksheet>',
 'xl/worksheets/sheet2.xml':'<worksheet><sheetData><row r="9"><c r="E9"><f>H5-I5</f><v>42</v></c></row></sheetData></worksheet>',
 'xl/styles.xml':'<styleSheet><numFmts/></styleSheet>',
 'xl/metadata':'opaque source roundtrip metadata'
};}
function rows(){return [Array.from({length:14},(_,i)=>'Header '+i),['X26-P000006-v1','X26-P000006',1,46613,'PRUEBA · Nacho','Málaga <playa> & "mar"','Guitarra; voz',1230,369,861,'https://drive.google.com/file/d/test/view','a'.repeat(64),'PRUEBA · pendiente',46332]];}
const plain=x=>JSON.parse(JSON.stringify(x));
test('adds one owned worksheet and preserves every original worksheet, formula, style and opaque part',()=>{
 const p=fixture(),snapshot=JSON.stringify(p),b=ctx.feXBuild_(p,rows());
 assert.equal(JSON.stringify(p),snapshot);
 assert.deepEqual(plain(b.changed).sort(),['[Content_Types].xml','xl/_rels/workbook.xml.rels','xl/workbook.xml','xl/worksheets/fe_contracts_test_2027.xml'].sort());
 for(const n of Object.keys(p))if(!b.changed.includes(n))assert.equal(b.parts[n],p[n]);
 assert.match(b.parts['xl/workbook.xml'],/sheetId="6"/);
 assert.match(b.sheet,/<c r="D2" s="3" t="n"><v>46613<\/v>/);
 assert.match(b.sheet,/<c r="H2" s="4" t="n"><v>1230<\/v>/);
});
test('repeating is a no-op; new projection changes only its own XML',()=>{
 const b=ctx.feXBuild_(fixture(),rows()),again=ctx.feXBuild_(b.parts,rows());assert.deepEqual(plain(again.changed),[]);
 const r=rows();r[1][7]=1500;const next=ctx.feXBuild_(again.parts,r);assert.deepEqual(plain(next.changed),['xl/worksheets/fe_contracts_test_2027.xml']);
});
test('escapes XML and stores strings as inline data, never formulas',()=>{
 const r=rows();r[1][4]='=HYPERLINK("x")';const b=ctx.feXBuild_(fixture(),r);
 assert.match(b.sheet,/=HYPERLINK\(&quot;x&quot;\)/);assert.match(b.sheet,/Málaga &lt;playa&gt; &amp; &quot;mar&quot;/);assert.doesNotMatch(b.sheet,/<f>/);
});
test('rejects a colliding user sheet, owned-part collision or changed ledger relationship',()=>{
 for(const alter of [p=>p['xl/workbook.xml']=p['xl/workbook.xml'].replace('Balance','PRUEBA contratos 2027'),p=>p['xl/worksheets/fe_contracts_test_2027.xml']='private unrelated worksheet',p=>p['xl/_rels/workbook.xml.rels']=p['xl/_rels/workbook.xml.rels'].replace('worksheets/sheet1.xml','worksheets/other.xml')]){
  const p=fixture();alter(p);assert.throws(()=>ctx.feXBuild_(p,rows()),/Excel:/);
 }
});
test('rejects unsupported XML, missing styles, non-finite numeric values and 1904 date system',()=>{
 for(const alter of [p=>p['xl/workbook.xml']='<!DOCTYPE x>'+p['xl/workbook.xml'],p=>p['xl/worksheets/sheet1.xml']=p['xl/worksheets/sheet1.xml'].replace('r="D5"','r="D6"'),p=>p['xl/workbook.xml']=p['xl/workbook.xml'].replace('<sheets>','<workbookPr date1904="1"/><sheets>')]){
  const p=fixture();alter(p);assert.throws(()=>ctx.feXBuild_(p,rows()),/Excel:/);
 }const r=rows();r[1][7]=Infinity;assert.throws(()=>ctx.feXBuild_(fixture(),r),/INVALID_NUMBER/);
});
test('Office updates require the exact ETag and target, without logging bearer credentials',()=>{
 let captured;const c=vm.createContext({ScriptApp:{getOAuthToken:()=> 'private-token'},UrlFetchApp:{fetch:(url,opts)=>(captured={url,opts})}});
 vm.runInContext(fs.readFileSync(__dirname+'/../tools/ContractIntegration.js','utf8'),c);
 c.feXPut_('file-test',{getBytes:()=>[1,2,3]},'"current-etag"');
 assert.match(captured.url,/upload\/drive\/v2\/files\/file-test\?uploadType=media&newRevision=true$/);
 assert.equal(captured.opts.method,'put');assert.equal(captured.opts.headers['If-Match'],'"current-etag"');assert.equal(captured.opts.followRedirects,false);
});
test('sync cannot run outside explicit test mode or without enabling the preview',()=>{
 for(const props of [{},{FE_APP_TEST_MODE:'false',FE_XLSX_PREVIEW_2027:'TEST_ONLY'},{FE_APP_TEST_MODE:'true'}]){
  ctx.props_=()=>({getProperty:k=>props[k]});assert.throws(()=>ctx.feCiXlsxSync_(),/TEST_MODE_REQUIRED/);
 }
});
