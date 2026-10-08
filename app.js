const samples={
 THYAO:{score:78,rsi:"61.4",trend:"📈 Pozitif",risk:"Orta",signal:"OLUMLU",comment:"Teknik görünüm pozitif. RSI aşırı alım bölgesinde değil; hareketli ortalamalar trendi destekliyor. Canlı veri ve güncel bilanço bağlandığında temel/haber skoru da hesaplanacak."},
 ASELS:{score:84,rsi:"66.2",trend:"📈 Güçlü Pozitif",risk:"Orta",signal:"OLUMLU",comment:"Momentum güçlü görünüyor. Ancak yükselen momentumda geri çekilme riski ayrıca izlenmeli."},
 TUPRS:{score:71,rsi:"57.8",trend:"➡️ Nötr-Pozitif",risk:"Orta",signal:"NÖTR-POSİTİF",comment:"Trend destekleyici ancak güçlü sinyal için fiyat ve hacim teyidi gerekiyor."}
};
function analyze(){
 const s=document.getElementById("symbol").value.trim().toUpperCase();
 const d=samples[s]||{score:50,rsi:"50.0",trend:"➡️ Nötr",risk:"Yüksek",signal:"VERİ BEKLENİYOR",comment:`${s||"Hisse"} için örnek analiz gösteriliyor. Canlı BIST veri kaynağı bağlandığında gerçek göstergeler hesaplanacaktır.`};
 document.getElementById("score").textContent=d.score;
 document.getElementById("meter").style.width=d.score+"%";
 document.getElementById("signal").textContent=d.signal;
 document.getElementById("trend").textContent=d.trend;
 document.getElementById("risk").textContent=d.risk;
 document.getElementById("rsi").textContent=d.rsi;
 document.getElementById("comment").textContent=d.comment;
}
analyze();