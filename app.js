const API = "https://api.apinoktam.erenozdemir.com.tr/public/v1/bist";
const HISTORY = (s) => `https://api.apinoktam.erenozdemir.com.tr/public/v1/bist/${encodeURIComponent(s)}/gecmis`;

const $ = id => document.getElementById(id);
const num = v => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/\./g,"").replace(",",".").replace("%",""));
  return Number.isFinite(n) ? n : null;
};

function pick(o, keys){
  for(const k of keys){
    if(o && o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  }
  return null;
}

function unwrap(json){
  if(Array.isArray(json)) return json;
  if(Array.isArray(json?.data)) return json.data;
  if(Array.isArray(json?.data?.items)) return json.data.items;
  if(Array.isArray(json?.items)) return json.items;
  return json?.data || json;
}

function normalizeQuote(raw, symbol){
  const o = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});
  return {
    symbol: String(pick(o,["symbol","sembol","kod","code","ticker"]) || symbol).toUpperCase(),
    name: pick(o,["name","ad","unvan","company"]) || symbol,
    price: num(pick(o,["price","fiyat","last","son","close","kapanis"])),
    change: pick(o,["changePercent","change_pct","degisimYuzde","yuzde","percentChange","change"]) 
  };
}

function extractCloses(raw){
  const arr = unwrap(raw);
  const list = Array.isArray(arr) ? arr : (Array.isArray(arr?.history) ? arr.history : []);
  return list.map(x => num(pick(x,["close","kapanis","kapanış","fiyat","last","price"]))).filter(x=>x!==null);
}

function sma(a,n){ return a.length<n ? null : a.slice(-n).reduce((x,y)=>x+y,0)/n; }

function emaSeries(a,n){
  if(a.length<n) return [];
  const k=2/(n+1);
  let e=a.slice(0,n).reduce((x,y)=>x+y,0)/n;
  const out=[e];
  for(let i=n;i<a.length;i++){ e=a[i]*k+e*(1-k); out.push(e); }
  return out;
}

function rsi(a,n=14){
  if(a.length<n+1) return null;
  let gains=0, losses=0;
  for(let i=a.length-n;i<a.length;i++){
    const d=a[i]-a[i-1];
    if(d>=0) gains+=d; else losses-=d;
  }
  if(losses===0) return 100;
  const rs=(gains/n)/(losses/n);
  return 100-(100/(1+rs));
}

function macd(a){
  if(a.length<35) return null;
  const e12=emaSeries(a,12), e26=emaSeries(a,26);
  const macdLine=[];
  for(let i=0;i<e26.length;i++){
    const idx=i+26-12;
    if(e12[idx]!==undefined) macdLine.push(e12[idx]-e26[i]);
  }
  if(macdLine.length<9) return null;
  const signal=emaSeries(macdLine,9).at(-1);
  const line=macdLine.at(-1);
  return {line,signal,hist:line-signal};
}

function scoreData(q, closes){
  const price=q.price ?? closes.at(-1);
  const ma20=sma(closes,20), ma50=sma(closes,50), r=rsi(closes), m=macd(closes);
  let score=50, reasons=[];
  if(r!==null){
    if(r>=55 && r<70){score+=12; reasons.push("RSI momentumu olumlu");}
    else if(r>=70){score-=8; reasons.push("RSI aşırı alım bölgesinde");}
    else if(r<35){score+=8; reasons.push("RSI düşük, tepki potansiyeli var");}
    else {reasons.push("RSI nötr bölgede");}
  }
  if(price!==null && ma20!==null){
    if(price>ma20){score+=8; reasons.push("fiyat MA20 üzerinde");}
    else score-=6;
  }
  if(price!==null && ma50!==null){
    if(price>ma50){score+=10; reasons.push("fiyat MA50 üzerinde");}
    else score-=8;
  }
  if(m){
    if(m.hist>0){score+=10; reasons.push("MACD pozitif");}
    else score-=8;
  }
  score=Math.max(0,Math.min(100,Math.round(score)));
  const trend = price!==null && ma20!==null && ma50!==null
    ? (price>ma20 && ma20>ma50 ? "📈 Güçlü Pozitif" : price>ma20 ? "📈 Pozitif" : price<ma20 && price<ma50 ? "📉 Negatif" : "➡️ Nötr")
    : "➡️ Nötr";
  const risk = r!==null && (r>72 || r<28) ? "Yüksek" : score>=70 ? "Orta" : "Yüksek";
  const signal = score>=75 ? "OLUMLU" : score>=55 ? "NÖTR-POSİTİF" : score>=40 ? "NÖTR" : "RİSKLİ";
  return {score,ma20,ma50,rsi:r,macd:m,trend,risk,signal,reasons};
}

async function getJSON(url){
  const res=await fetch(url,{headers:{Accept:"application/json"},cache:"no-store"});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function setStatus(text, good=false){ $("status").textContent=(good?"● ":"● ")+text; $("status").style.color=good?"#67e8a9":"#9eabc4"; }

function render(q, a, closes){
  $("company").textContent=q.symbol;
  $("price").textContent=q.price!==null ? q.price.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}) : "—";
  $("change").textContent=q.change!==null ? String(q.change).includes("%") ? q.change : `${q.change}%` : "—";
  $("updated").textContent=new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"});
  $("score").textContent=a.score;
  $("meter").style.width=a.score+"%";
  $("signal").textContent=a.signal;
  $("trend").textContent=a.trend;
  $("trendText").textContent=a.reasons.length?a.reasons.slice(0,2).join(" • "):"Yeterli veri bulunamadı.";
  $("risk").textContent=a.risk;
  $("riskText").textContent=a.rsi!==null?`RSI ${a.rsi.toFixed(1)} • ${closes.length} kapanış verisi`:"Volatilite verisi sınırlı.";
  $("rsi").textContent=a.rsi!==null?a.rsi.toFixed(1):"—";
  $("macd").textContent=a.macd?(a.macd.hist>=0?"Pozitif":"Negatif"):"—";
  $("ma20").textContent=a.ma20!==null?(q.price>=a.ma20?"Üzerinde":"Altında"):"—";
  $("ma50").textContent=a.ma50!==null?(q.price>=a.ma50?"Üzerinde":"Altında"):"—";
  $("comment").textContent=`${q.symbol} için AI skor ${a.score}/100. ${a.reasons.join(". ")}. Bu sonuç yalnızca teknik göstergelere dayalı otomatik bir değerlendirmedir; bilanço ve haberler henüz skora dahil değildir.`;
}

async function analyze(symbol){
  const s=(symbol || $("symbol").value).trim().toUpperCase();
  if(!s) return;
  $("analyzeBtn").disabled=true;
  setStatus(`${s} verisi çekiliyor...`);
  try{
    const quoteRaw=await getJSON(`${API}/${encodeURIComponent(s)}`);
    const q=normalizeQuote(quoteRaw,s);
    let closes=[];
    try{ closes=extractCloses(await getJSON(HISTORY(s))); }catch(e){}
    if(q.price===null && closes.length) q.price=closes.at(-1);
    const a=scoreData(q,closes);
    render(q,a,closes);
    setStatus(`${s} verisi alındı`,true);
  }catch(err){
    $("comment").textContent=`${s} için veri alınamadı. API erişimi veya sembolü kontrol edin.`;
    setStatus("Veri alınamadı");
    $("score").textContent="—"; $("meter").style.width="0%";
  }finally{$("analyzeBtn").disabled=false;}
}

async function loadStocks(){
  try{
    const raw=await getJSON(API);
    const arr=unwrap(raw);
    const stocks=Array.isArray(arr)?arr:[];
    const list=$("stockList"); list.innerHTML="";
    stocks.slice(0,40).forEach(x=>{
      const q=normalizeQuote(x,"");
      if(!q.symbol) return;
      const b=document.createElement("button"); b.className="stock"; b.textContent=q.symbol;
      b.onclick=()=>{$("symbol").value=q.symbol; analyze(q.symbol);};
      list.appendChild(b);
    });
    if(!list.children.length) list.textContent="Hisse listesi alınamadı.";
  }catch(e){$("stockList").textContent="Hisse listesi şu an yüklenemedi.";}
}

$("analyzeBtn").addEventListener("click",()=>analyze());
$("symbol").addEventListener("keydown",e=>{if(e.key==="Enter") analyze();});
analyze("THYAO");
loadStocks();
