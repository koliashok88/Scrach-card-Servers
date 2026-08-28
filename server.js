const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {URL}=require('url');
const PORT=Number(process.env.PORT||3000);
const BASE=(process.env.PUBLIC_BASE_URL||'').replace(/\/$/,'');
const ADMIN_KEY=process.env.ADMIN_API_KEY||'';
const DATA_DIR=path.join(__dirname,'data');
const DB=path.join(DATA_DIR,'cards.json');
fs.mkdirSync(DATA_DIR,{recursive:true});
if(!fs.existsSync(DB))fs.writeFileSync(DB,'{}');
function load(){try{return JSON.parse(fs.readFileSync(DB,'utf8')||'{}')}catch{return {}}}
function save(x){fs.writeFileSync(DB,JSON.stringify(x,null,2))}
function json(res,status,obj){const b=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(b)}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>1e6)req.destroy()});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});req.on('error',reject)})}
function esc(s){return String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]))}
function cardUrl(id){return `${BASE||''}/scratch/${encodeURIComponent(id)}`}
function auth(req){return !ADMIN_KEY || req.headers['x-api-key']===ADMIN_KEY}
const index=fs.readFileSync(path.join(__dirname,'public','index.html'));
const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,X-API-Key','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});return res.end()}
  if(req.method==='POST'&&u.pathname==='/api/cards'){
    if(!auth(req))return json(res,401,{error:'Unauthorized'});
    try{const p=await body(req);if(!p.reward||!p.tier||!p.code)return json(res,400,{error:'tier, reward and code are required'});const cards=load();const id=crypto.randomBytes(18).toString('hex');cards[id]={id,tier:String(p.tier),tierIcon:String(p.tierIcon||'🎁'),reward:String(p.reward),code:String(p.code),shop:String(p.shop||'SS Mobile'),billNo:String(p.billNo||''),customerName:String(p.customerName||''),createdAt:new Date().toISOString(),revealed:false,revealedAt:null};save(cards);return json(res,201,{id,url:cardUrl(id),card:cards[id]})}catch(e){return json(res,400,{error:'Invalid JSON'})}
  }
  const m=u.pathname.match(/^\/api\/cards\/([a-f0-9]{36})$/);
  if(m&&req.method==='GET'){const c=load()[m[1]];return c?json(res,200,{card:c}):json(res,404,{error:'Card not found'})}
  if(m&&req.method==='POST'&&u.pathname.endsWith('/reveal')){const id=m[1];const cards=load();if(!cards[id])return json(res,404,{error:'Card not found'});cards[id].revealed=true;cards[id].revealedAt=cards[id].revealedAt||new Date().toISOString();save(cards);return json(res,200,{card:cards[id]})}
  const sm=u.pathname.match(/^\/scratch\/([a-f0-9]{36})$/);
  if(sm&&req.method==='GET'){const c=load()[sm[1]];if(!c)return page(res,404,'Scratch Card Not Found','हे Scratch Card उपलब्ध नाही.');return page(res,200,'🎁 Scratch Card',scratchMarkup(c,sm[1]))}
  if(u.pathname==='/'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(index)}
  if(u.pathname.startsWith('/public/')&&req.method==='GET'){const f=path.join(__dirname,u.pathname.replace('/public/','public/'));if(fs.existsSync(f)&&fs.statSync(f).isFile()){res.writeHead(200,{'Content-Type':'image/png'});return res.end(fs.readFileSync(f))}}
  res.writeHead(404);res.end('Not found');
});
function page(res,status,title,content){const html=`<!doctype html><html lang="mr"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta charset="utf-8"><title>${esc(title)}</title><style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:linear-gradient(145deg,#fff7ed,#fef3c7);color:#422006;min-height:100vh}.wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{width:min(92vw,540px);text-align:center}.shop{font-weight:900;font-size:20px}.icon{font-size:58px;margin:8px}.sub{color:#78350f}.scratch{position:relative;width:100%;aspect-ratio:900/420;background:#fff;border:3px solid #d97706;border-radius:22px;overflow:hidden;box-shadow:0 14px 40px #0003}.reward{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;font-size:clamp(24px,7vw,42px);font-weight:900}.scratch canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}.hint{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:clamp(18px,4vw,28px);font-weight:900;text-shadow:0 2px 4px #000;pointer-events:none}.tier{margin-top:12px;font-weight:800}.status{margin-top:12px;font-weight:800;color:#78350f}</style></head><body><div class="wrap"><div class="card"><div class="shop">${esc(content.shop||'SS Mobile')}</div><div class="icon">${esc(content.tierIcon||'🎁')}</div><h1>🎁 Scratch Card</h1><p class="sub">तुमच्यासाठी खास बक्षीस! बक्षीस पाहण्यासाठी कार्ड Scratch करा.</p><div class="scratch"><div class="reward">${esc(content.reward)}</div><canvas id="c" width="900" height="420"></canvas><div class="hint" id="h">👆 बोटाने येथे Scratch करा</div></div><div class="tier">${esc(content.tier||'')} CARD • ${esc(content.code||'')}</div><div class="status" id="s">कार्ड Scratch केल्यावरच बक्षीस दिसेल.</div></div></div><script>const cardId=${JSON.stringify(content.id||'')};const c=document.getElementById('c'),x=c.getContext('2d'),w=c.width,h=c.height;let down=false,n=0,done=false;const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#6b7280');g.addColorStop(.5,'#d1d5db');g.addColorStop(1,'#4b5563');x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='rgba(255,255,255,.25)';x.font='bold 54px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('SCRATCH HERE',w/2,h/2);function go(e){if(!down||done)return;const r=c.getBoundingClientRect(),px=(e.clientX-r.left)*w/r.width,py=(e.clientY-r.top)*h/r.height;x.globalCompositeOperation='destination-out';x.beginPath();x.arc(px,py,36,0,Math.PI*2);x.fill();if(++n>=55){done=true;c.style.display='none';document.getElementById('h').style.display='none';document.getElementById('s').textContent='🎉 अभिनंदन! तुमचे बक्षीस उघडले आहे. Card ID: '+${JSON.stringify(content.code||'')};fetch('/api/cards/'+cardId+'/reveal',{method:'POST'}).catch(()=>{});}}c.addEventListener('pointerdown',e=>{down=true;c.setPointerCapture?.(e.pointerId);go(e)});c.addEventListener('pointermove',go);['pointerup','pointercancel','pointerleave'].forEach(k=>c.addEventListener(k,()=>down=false));</script></body></html>`;res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)}
server.listen(PORT,()=>console.log(`SS Mobile Scratch server listening on ${PORT}`));
