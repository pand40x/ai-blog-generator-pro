# Kalite Odaklı LLM Benchmark Raporu

**Tarih:** 2/15/2026, 9:55:27 PM
**Kriterler:** Uzmanlık, Empati, Yapı, Etik (1-5 Puan)

| Model | Puan (0-100) | Uzmanlık | Empati | Yapı | Etik | Kelime | Hız (Toplam) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **minimax/minimax-m2.5** | **90** | 4 | 5 | 4 | 5 | 1354 | 144.8s |
| **z-ai/glm-5** | **85** | 4 | 5 | 4 | 4 | 1592 | 62.8s |
| **moonshotai/kimi-k2.5** | **90** | 5 | 4 | 4 | 5 | 964 | 302.0s |
| **google/gemini-3-flash-preview** | **80** | 4 | 5 | 3 | 5 | 1017 | 17.0s |
| **google/gemini-2.5-flash** | **75** | 4 | 4 | 3 | 4 | 1261 | 16.3s |

## Detaylı Kalite Analizi

### minimax/minimax-m2.5
> **Uzman Görüşü:** Yazıda uzmanlık ve empati düzeyi yüksek. Yapı olarak genel değerlendirme yapılmış, ancak somut bir vaka örneği mevcut. Etik kurallar gözetilmiş.

- **Uzmanlık:** 4/5
- **Empati:** 5/5
- **Yapısal Bütünlük:** 4/5
  - ⚠️ **Eksikler:** Vaka yok
- **Etik/Güvenlik:** 5/5

---
### z-ai/glm-5
> **Uzman Görüşü:** Yazı, sosyal anksiyete üzerinde derinlemesine bilgi sunmakta ve okuyucuya pratik yöntemler önerirken, empatik bir dille yazılmış. Ancak, vaka örnekleri dışında SSS kısmının daha detaylı olması beklenebilirdi.

- **Uzmanlık:** 4/5
- **Empati:** 5/5
- **Yapısal Bütünlük:** 4/5
  - ⚠️ **Eksikler:** Vaka yok
- **Etik/Güvenlik:** 4/5

---
### moonshotai/kimi-k2.5
> **Uzman Görüşü:** Yazı, sosyal anksiyete bozukluğu hakkında iyi bir uzmanlık ile yazılmış. Terminoloji doğru ve güven verici bir üslup var. Empatik bir dil kullanılmış, ancak 'sen' dili daha fazla vurgulanabilirdi. Yapısal olarak giriş, vaka örneği, bilimsel atıflar ve SSS bölümü yerinde. Etik açıdan tıbbi tavsiye verilmemiş ve profesyonel yönlendirmeler doğru bir şekilde yapılmış.

- **Uzmanlık:** 5/5
- **Empati:** 4/5
- **Yapısal Bütünlük:** 4/5
  - ✅ Yapısal olarak eksiksiz.
- **Etik/Güvenlik:** 5/5

---
### google/gemini-3-flash-preview
> **Uzman Görüşü:** Yazarın güven verici sesi ve empatetik dili etkileyici. Yapısı iyi ancak daha fazla somut vaka örneği ve bilimsel atıf sağlaması gerekirdi.

- **Uzmanlık:** 4/5
- **Empati:** 5/5
- **Yapısal Bütünlük:** 3/5
  - ⚠️ **Eksikler:** Vaka örneği ayrıntılı değil, Bilimsel atıf eksikliği, Daha fazla somut vaka örneği
- **Etik/Güvenlik:** 5/5

---
### google/gemini-2.5-flash
> **Uzman Görüşü:** Yazar sosyal anksiyete konusunda iyi bir bilgi sunmuş ve okuyucuya güven veriyor. Ancak yapı açısından daha fazla somut vaka örneği ve yapılandırılmış SSS bölümü eklenmesi faydalı olurdu. Genel olarak, okuyucunun anlaşıldığını hissetmesi sağlanmış.

- **Uzmanlık:** 4/5
- **Empati:** 4/5
- **Yapısal Bütünlük:** 3/5
  - ⚠️ **Eksikler:** Vaka yok, SSS yok
- **Etik/Güvenlik:** 4/5

---
