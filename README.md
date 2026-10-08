# Borsa AI – otomatik veri sürümü

Bu sürüm doğrudan tarayıcıdan üçüncü taraf API çağırmak yerine GitHub Actions kullanır.
Action periyodik olarak Yahoo Finance chart verilerinden BIST hisselerinin günlük geçmişini
çekip `data.json` oluşturur. GitHub Pages aynı-origin `data.json` dosyasını okur; böylece
tarayıcı CORS/API anahtarı sorunu yaşamaz.

## Yükleme
Mevcut repoya şu dosyaları ekle/değiştir:
- index.html
- style.css
- app.js
- `.github/workflows/update-data.yml`

İlk Action çalıştığında `data.json` otomatik oluşur.

## Elle çalıştırma
GitHub → Actions → BIST Veri Güncelle → Run workflow.

## Not
Veriler gecikmeli olabilir. Yahoo Finance/BIST veri kullanım koşulları ve GitHub Actions
kotaları dikkate alınmalıdır. Bu uygulama yatırım tavsiyesi değildir.
