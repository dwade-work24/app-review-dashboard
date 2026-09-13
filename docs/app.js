
'use strict';
let all=[], applicationDefinitions=[], coverageData=[], categoryDefinitions=[], categoryLabels={};
const $=id=>document.getElementById(id),fmt=n=>n.toLocaleString(),pct=(n,d)=>d?(100*n/d).toFixed(1)+'%':'—';

let selected=[],page=0;const size=20;
const count=a=>a.reduce((n,r)=>n+(r.n??1),0);
function stats(a){return {n:count(a),avg:count(a)?(a.reduce((s,r)=>s+r.rating*(r.n??1),0)/count(a)).toFixed(2):'—',low:count(a.filter(r=>r.rating<=2)),high:count(a.filter(r=>r.rating>=4))}}
function el(tag,text,cls){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x}
function inDates(r){const d=r.review_date.slice(0,10);return (!$('from').value||d>=$('from').value)&&(!$('to').value||d<=$('to').value)}
function render(){const appKey=$('application').value||'rheem_econet';$('detail-title').textContent=applicationDefinitions.find(a=>a.key===appKey).display_name+' — Customer Review Intelligence';renderCoverage(appKey);const dated=all.filter(inDates),base=dated.filter(r=>!$('store').value||r.store===$('store').value);selected=base.filter(r=>!$('category').value||r.feedback_category===$('category').value);renderCategories(base);const s=stats(selected);$('count').textContent=fmt(s.n);$('average').textContent=s.avg+(s.n?' / 5':'');$('low').textContent=pct(s.low,s.n);$('high').textContent=pct(s.high,s.n);const dates=selected.map(r=>r.review_date.slice(0,10)).sort();$('range').textContent=s.n?dates[0]+' — '+dates.at(-1):'No reviews in this selection';$('observation').textContent=s.n?`${fmt(s.low)} of ${fmt(s.n)} selected written reviews have 1–2 stars; ${fmt(s.high)} have 4–5 stars. Use the explorer to investigate what customers describe. Ratings alone do not identify recurring issues or root causes.`:'No reviews match this date and store selection. Adjust or reset the filters.';
$('ratings').replaceChildren();for(let star=1;star<=5;star++){const n=count(selected.filter(r=>r.rating===star)),row=el('div',undefined,'barrow'),track=el('div',undefined,'track'),fill=el('div',undefined,'fill');fill.style.width=(s.n?100*n/s.n:0)+'%';track.append(fill);row.append(el('span',star+' ★'),track,el('span',fmt(n)+' · '+pct(n,s.n),'right muted'));$('ratings').append(row)}
$('comparison').replaceChildren();for(const store of ['apple','google']){const a=dated.filter(r=>r.store===store&&(!$('category').value||r.feedback_category===$('category').value)),v=stats(a),ds=a.map(r=>r.review_date.slice(0,10)).sort(),tr=el('tr');for(const val of [store==='apple'?'Apple App Store':'Google Play',fmt(v.n),v.avg,pct(v.low,v.n),pct(v.high,v.n),v.n?ds[0]+' → '+ds.at(-1):'No reviews'])tr.append(el('td',val));$('comparison').append(tr)}
const previous=$('version').value;$('version').replaceChildren(new Option('All versions',''));for(const v of [...new Set(selected.map(r=>r.app_version||'(unknown)'))].sort())$('version').add(new Option(v,v));$('version').value=[...$('version').options].some(o=>o.value===previous)?previous:'';
renderTrend();renderSentiment();page=0;renderReviews()}
function monthlyGroups(){const groups={};for(const r of selected){const m=r.review_date.slice(0,7);(groups[m]??=[]).push(r)}const keys=Object.keys(groups).sort(),months=[];if(keys.length){let d=new Date(keys[0]+'-01T00:00:00Z');while(d.toISOString().slice(0,7)<=keys.at(-1)){months.push(d.toISOString().slice(0,7));d.setUTCMonth(d.getUTCMonth()+1)}}return {groups,months}}
function stackedBar(target,month,counts,max,text,detail){const wrap=el('div',undefined,'month'),bar=el('button',undefined,'stack');bar.style.height=(180*counts.reduce((a,b)=>a+b,0)/max)+'px';bar.title=text;bar.setAttribute('aria-label',text);const colors=['var(--green)','var(--yellow)','var(--orange)','#a0a0a0'];counts.forEach((n,i)=>{const seg=el('span',undefined,'segment');seg.style.height=(180*n/max)+'px';seg.style.background=colors[i];bar.append(seg)});bar.onmouseenter=bar.onfocus=()=>{$(detail).textContent=text};wrap.append(bar,el('span',month));$(target).append(wrap)}
function renderTrend(){const {groups,months}=monthlyGroups(),shown=months.slice(-24),max=Math.max(1,...shown.map(m=>count(groups[m]||[])));$('trend').replaceChildren();$('months').replaceChildren();$('chartdetail').textContent='Hover or focus a bar for rating counts and average stars.';for(const m of months){const s=stats(groups[m]||[]),mid=s.n-s.low-s.high,tr=el('tr');for(const v of [m,fmt(s.n),s.avg,fmt(s.high),fmt(mid),fmt(s.low)])tr.append(el('td',v));$('months').append(tr);if(shown.includes(m))stackedBar('trend',m,[s.high,mid,s.low],max,`${m}: ${s.n} reviews · ${s.high} rated 4–5 stars · ${mid} rated 3 stars · ${s.low} rated 1–2 stars · ${s.avg} average`,'chartdetail')}if(!months.length)$('trend').append(el('p','No monthly data','empty'))}
function renderSentiment(){const labels=['positive','neutral','negative','unscored'],colors=['var(--green)','var(--yellow)','var(--orange)','#a0a0a0'],scored=selected.filter(r=>r.sentiment_score!==null);$('sentimentaverage').textContent=scored.length?(scored.reduce((n,r)=>n+r.sentiment_score*(r.n??1),0)/count(scored)).toFixed(3):'—';$('scoredcount').textContent=fmt(count(scored));$('sentimentdistribution').replaceChildren();$('sentimentlegend').replaceChildren();for(let i=0;i<labels.length;i++){const n=count(selected.filter(r=>r.sentiment===labels[i])),seg=el('span');seg.style.width=(selected.length?100*n/count(selected):0)+'%';seg.style.background=colors[i];seg.title=labels[i]+': '+n;$('sentimentdistribution').append(seg);const entry=el('span',`${labels[i]}: ${fmt(n)} (${pct(n,count(selected))})`),dot=el('i',undefined,'dot');dot.style.background=colors[i];entry.prepend(dot);$('sentimentlegend').append(entry)}$('sentimentmatrix').replaceChildren();for(let star=1;star<=5;star++){const tr=el('tr');tr.append(el('td',star+' ★'));for(const category of labels)tr.append(el('td',fmt(count(selected.filter(r=>r.rating===star&&r.sentiment===category)))));$('sentimentmatrix').append(tr)}const {groups,months}=monthlyGroups(),shown=months.slice(-24),max=Math.max(1,...shown.map(m=>count(groups[m]||[])));$('sentimenttrend').replaceChildren();$('sentimentdetail').textContent='Hover or focus a bar for sentiment counts.';for(const m of shown){const counts=labels.map(c=>count((groups[m]||[]).filter(r=>r.sentiment===c)));stackedBar('sentimenttrend',m,counts,max,m+': '+counts.map((n,i)=>n+' '+labels[i]).join(' · '),'sentimentdetail')}if(!months.length)$('sentimenttrend').append(el('p','No monthly data','empty'))}
function renderCoverage(key){$('detailcoverage').replaceChildren();for(const c of coverageData.filter(c=>c.application_key===key)){const box=el('div');box.append(el('h3',c.application_name+' · '+c.store),el('p',`${c.unique_written_reviews} written reviews · ${c.country||'—'}/${c.language||'not specified'} · ${c.earliest||'—'} — ${c.latest||'—'}`,'muted'),el('p',`Retrieved ${c.retrieved_at||'—'} · Latest attempt ${c.collection_timestamp||'—'} · ${c.status} / ${c.stop_reason||'—'}`,'note'),el('p',c.method+' · '+c.limitations,'note'));if(c.error)box.append(el('p',c.error,'note'));$('detailcoverage').append(box)}}
function renderCategories(base){$('categorysummary').replaceChildren();for(const category of categoryDefinitions){const rows=base.filter(r=>r.feedback_category===category.id),s=stats(rows),tr=el('tr'),cell=el('td'),button=el('button',category.label);button.style.cssText='margin:0;text-align:left;background:white;border:0;padding:0;color:var(--brand)';button.onclick=()=>{$('category').value=category.id;render()};cell.append(button);tr.append(cell);for(const value of [fmt(s.n),pct(s.n,count(base)),s.avg,['positive','neutral','negative'].map(c=>fmt(count(rows.filter(r=>r.sentiment===c)))).join(' / ')])tr.append(el('td',value));$('categorysummary').append(tr)}const flagged=count(base.filter(r=>r.category_review_needed));$('categoryflags').textContent=`${fmt(flagged)} reviews have tied primary-topic matches or no specific match and are flagged for review. Primary totals sum to ${fmt(count(base))} reviews. Additional tags are not included in these totals.`}
function renderReviews(){if(!reviewCache[activeKey]){ $('results').textContent='Open the explorer to load reviews for this application.'; $('reviews').replaceChildren(); $('page').textContent=''; $('prev').disabled=$('next').disabled=true; return; } const q=$('search').value.trim().toLowerCase();let a=reviewCache[activeKey].filter(inDates).filter(r=>(!$('store').value||r.store===$('store').value)&&(!$('category').value||r.feedback_category===$('category').value)).filter(r=>(!$('sentimentfilter').value||r.sentiment===$('sentimentfilter').value)&&(!$('rating').value||r.rating===Number($('rating').value))&&(!$('version').value||(r.app_version||'(unknown)')===$('version').value)&&(!q||[r.title,r.body,r.author,r.developer_response].join(' ').toLowerCase().includes(q)));const sort=$('sort').value;a.sort((a,b)=>sort==='lowest'?a.rating-b.rating||b.review_date.localeCompare(a.review_date):sort==='highest'?b.rating-a.rating||b.review_date.localeCompare(a.review_date):sort==='oldest'?a.review_date.localeCompare(b.review_date):b.review_date.localeCompare(a.review_date));const pages=Math.ceil(a.length/size);page=Math.max(0,Math.min(page,pages-1));$('results').textContent=fmt(a.length)+' matching written reviews';$('reviews').replaceChildren();for(const r of a.slice(page*size,(page+1)*size)){const article=el('article');article.style.cssText='border-top:1px solid var(--line);padding:18px 0';const meta=el('div');meta.append(el('span',r.rating+' / 5 ★','stars'),document.createTextNode('  '),el('span',(r.store==='apple'?'Apple':'Google')+' · '+r.review_date.slice(0,10)+' · v'+(r.app_version||'unknown'),'pill'));meta.append(el('span',r.sentiment+' · '+(r.sentiment_score===null?'unscored':r.sentiment_score.toFixed(3)),'pill sentimentbadge'));article.append(meta,el('div',r.title,'reviewtitle'),el('p',r.body,'reviewbody'),el('div',r.author||'Anonymous','muted'));if(r.developer_response){const detail=el('details');detail.append(el('summary','Developer response'),el('p',r.developer_response,'reviewbody'));article.append(detail)}const tags=el('div',categoryLabels[r.feedback_category]+(r.additional_categories.length?' · Also: '+r.additional_categories.map(c=>categoryLabels[c]).join(', '):''),'muted');article.append(tags);const evidence=el('details');evidence.append(el('summary',r.category_review_needed?'Category evidence · review suggested':'Category evidence'),el('p',r.category_rationale));for(const [id,snippets] of Object.entries(r.category_evidence))evidence.append(el('p',categoryLabels[id]+': '+snippets.join(' … '),'reviewbody'));article.append(evidence);$('reviews').append(article)}if(!a.length)$('reviews').append(el('p','No matching reviews. Try a broader search.','empty'));$('page').textContent=pages?`Page ${page+1} of ${pages}`:'No results';$('prev').disabled=page===0;$('next').disabled=page+1>=pages}
for(const id of ['store','from','to','category'])$(id).addEventListener('change',render);for(const id of ['search','rating','version','sort','sentimentfilter'])$(id).addEventListener('input',()=>{page=0;return ensureReviews()});$('prev').onclick=()=>{page--;renderReviews()};$('next').onclick=()=>{page++;renderReviews()};$('reset').onclick=()=>{for(const id of ['store','from','to','search','rating','version','sentimentfilter','category'])$(id).value='';$('sort').value='newest';render()};
const dashboardCache=Object.create(null), reviewCache=Object.create(null), pending=new Map();
let activeKey='', switchToken=0;
async function fetchJSON(path){
  const response=await fetch('./'+path);
  if(!response.ok)throw new Error('HTTP '+response.status);
  return response.json();
}
async function cached(cache,key,file){
  if(cache[key])return cache[key];
  const id=key+'/'+file;
  if(!pending.has(id))pending.set(id,fetchJSON('data/'+encodeURIComponent(key)+'/'+file+'.json').then(data=>{if(file==='dashboard' && (data.application_key!==key || !Array.isArray(data.filter_cells) || !Array.isArray(data.filter_columns)))throw new Error('Invalid dashboard data');if(file==='reviews' && !Array.isArray(data))throw new Error('Invalid review data');cache[key]=data;return data;}).finally(()=>pending.delete(id)));
  return pending.get(id);
}
async function selectApplication(){
  const key=$('application').value, token=++switchToken;
  activeKey=key; all=[]; selected=[];
  $('detail-title').textContent=(applicationDefinitions.find(a=>a.key===key)?.display_name||key)+' — Customer Review Intelligence';renderCoverage(key);
  $('app-status').textContent='Loading dashboard…'; $('app-detail').hidden=true;
  try{
    const data=await cached(dashboardCache,key,'dashboard');
    if(token!==switchToken)return;
    if(data.application_key!==key)throw new Error('Application mismatch');
    all=data.filter_cells.map(values=>Object.fromEntries(data.filter_columns.map((k,i)=>[k,values[i]])));
    $('app-detail').hidden=false; $('app-status').textContent='';
    $('reset').onclick();
  }catch(error){if(token===switchToken){$('app-status').textContent='Dashboard data could not be loaded. Select another app or try again.';}}
}
async function ensureReviews(){
  const key=activeKey;
  if(!key)return;
  $('results').textContent='Loading reviews…';
  try{
    await cached(reviewCache,key,'reviews');
    if(key===activeKey)renderReviews();
  }catch(error){if(key===activeKey)$('results').textContent='Review data could not be loaded. Refresh the page or try again.';}
}
async function start(){
  try{
    const summary=await fetchJSON('data/summary.json');
    applicationDefinitions=summary.applications; coverageData=summary.coverage;
    categoryDefinitions=summary.categories;categoryLabels=Object.fromEntries(categoryDefinitions.map(c=>[c.id,c.label]));
    // This fragment is generated by our autoescaped Jinja template, never review HTML.
    $('overview-root').innerHTML=summary.overview_html;
    $('generated').textContent='Generated '+summary.generated_at+' · '+fmt(summary.competitive.total)+' reviews in the saved corpus';
    $('application').addEventListener('change',selectApplication);
    $('load-reviews').onclick=ensureReviews;
    $('retry-app').onclick=selectApplication;
    await selectApplication();
  }catch(error){$('startup-status').textContent='Summary data could not be loaded. Refresh the page to try again.';}
}
start();