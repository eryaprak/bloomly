# 🌸 Bloomly Garden — Game Design Document
## Candy Crush Tarzı Match-3 + Bahçe Temalı 3D Bulmaca Oyunu

---

## 🎯 Konsept
Match-3 bulmaca oyunu + bahçe geliştirme. Oyuncu bölümleri geçerek bahçesini büyütür, süsler, yeni alanlar açar. 3D görseller, psikolojik bağımlılık mekanikleri, etik sınırlar içinde.

---

## 🧩 Core Gameplay

### Match-3 Mekaniği
- 8x8 grid, renkli çiçekler (gül, lale, papatya, orkide, lavanta)
- 3+ eşleştirme → patlama + puan
- 4'lü eşleşme → Güç çiçeği (satır/sütun temizler)
- 5'li L/T şekli → Bomba çiçek (3x3 alan)
- 5'li düz → Gökkuşağı çiçeği (tüm aynı rengi temizler)
- Combo zincirleri → çarpan (x2, x3, x5)

### Bölüm Tipleri
1. **Puan hedefi** — X puan topla
2. **Engel kırma** — buz/taş blokları kır
3. **Düşürme** — özel öğeleri alta indir
4. **Toplama** — X adet belirli çiçek topla
5. **Boss bölüm** — her 20 seviyede, özel mekanik
6. **Zaman yarışı** — sınırlı sürede hedef (bonus bölüm)

### Zorluk Eğrisi
- Seviye 1-20: Öğretici, kolay, %95 geçiş oranı
- Seviye 21-50: Orta, %70 geçiş
- Seviye 51-100: Zor, %40 geçiş → IAP tetikleyici
- Seviye 100+: Çok zor, %25 geçiş → hardcore oyuncular
- Toplam 500+ seviye (sürekli eklenir)

---

## 🏡 Bahçe Sistemi (Meta-game)

- Her 5 seviye geçişte bahçeye yeni alan/obje açılır
- Bahçe öğeleri: çiçekler, ağaçlar, havuz, bank, heykel, ışıklar, hayvanlar
- 3D render — döndürülebilir, zoom yapılabilir
- Mevsimsel temalar (ilkbahar, yaz, sonbahar, kış)
- Komşu bahçe ziyareti (sosyal)

---

## 💰 Ekonomi Sistemi

### Altın (Soft Currency)
- Bölüm geçince kazanılır (10-50 altın)
- Günlük görevlerden kazanılır
- Bahçe dekorasyonu satın alımı
- Basit güçlendiriciler

### Elmas (Hard Currency)
- Nadir kazanılır (başarımlar, özel etkinlikler)
- IAP ile satın alınır
- Ekstra can, güçlü boosters, premium dekorasyon
- Seviye geçemeyince 5 hamle daha

### IAP Paketleri
| Paket | Fiyat | İçerik |
|-------|-------|--------|
| Başlangıç Paketi | ₺29.99 | 100 elmas + 5000 altın + 3 booster |
| Haftalık Teklif | ₺49.99 | 300 elmas + günlük 50 altın (7 gün) |
| Bahçıvan Paketi | ₺99.99 | 800 elmas + premium dekor seti |
| Mega Paket | ₺199.99 | 2000 elmas + 50000 altın + tüm booster |
| Aylık VIP | ₺79.99/ay | Sınırsız can + günlük 100 elmas + özel bölümler |

### Booster'lar
- 🔨 Çekiç — tek taş kır (3 elmas)
- 🌈 Renk bombası — bir rengi temizle (5 elmas)
- ⏳ +5 Hamle — ekstra hamle (3 elmas)
- 💣 Mega bomba — büyük alan temizle (8 elmas)
- 🔀 Karıştırıcı — tahtayı yeniden diz (2 elmas)

---

## 🧠 Psikolojik Bağımlılık Mekanikleri (Etik Sınırlar İçinde)

### 1. Variable Ratio Reinforcement (Değişken Ödül)
- Rastgele bonus ödüller (beklenmedik altın yağmuru)
- "Neredeyse kazandın!" efekti (son 1 hamle kala)
- Mystery box'lar (günlük giriş)

### 2. Loss Aversion (Kayıp Korkusu)
- "Bölümü tekrar mı oynayacaksın? İlerlemen kaybolacak!"
- Streak kaybetme uyarısı
- Zamanlı teklifler (24 saat countdown)

### 3. Social Proof & Competition
- Haftalık liderboard
- Arkadaş bahçe ziyareti
- "Arkadaşın seni geçti!" bildirimi

### 4. Progression & Achievement
- Yıldız sistemi (her bölüm 1-3 yıldız)
- Başarım rozetleri (koleksiyoncu ruhu)
- Bahçe seviyesi (sürekli büyüme hissi)
- Sezon kartı (battle pass tarzı, ücretsiz + premium yol)

### 5. FOMO (Fear of Missing Out)
- Sınırlı süreli etkinlikler (haftalık)
- Özel mevsimsel dekorasyonlar (bir daha gelmez!)
- Flash sale'ler (2 saat)

### 6. Daily Hooks (Günlük Çengeller)
- Günlük giriş ödülü (7 günlük takvim, 7. gün BÜYÜK ödül)
- Günlük görev (3 basit görev → bonus kutu)
- Ücretsiz spin çarkı (4 saatte 1)
- Canlar yenilenir (30dk'da 1 can, max 5)

### 7. Zeigarnik Effect (Yarım Kalan İş)
- Bölüm yarıda bırakılınca "Devam et!" push notification
- Bahçede "inşaat devam ediyor" göstergesi
- "1 bölüm daha geç, ödülünü al!"

### ❌ ETİK SINIRLAR (YAPMAYACAKLARIMIZ)
- Çocuklara agresif IAP yok
- Pay-to-win değil (skill-based ilerleme mümkün)
- Gambling mekaniği yok (gacha/loot box)
- Sınırsız harcama teşviki yok (aylık limit uyarısı)
- Uyku saatlerinde push notification yok (22:00-08:00)

---

## 🎨 Görsel Stil & 3D

### Engine: react-three-fiber (Three.js for React Native)
- expo-gl + expo-three entegrasyonu
- 3D bahçe sahnesi (isometric view)
- Match-3 grid: 2.5D (3D objeler, 2D grid mantığı)
- Particle effects: patlama, ışıltı, confetti
- Smooth animasyonlar: 60fps hedef

### Art Style
- Stylized/cartoon 3D (Clash Royale / Gardenscapes tarzı)
- Canlı renkler, yumuşak gölgeler
- Çiçekler: gerçekçi ama stilize
- Karakterler: sevimli bahçıvan maskot
- UI: temiz, modern, büyük butonlar

### Ses & Müzik
- Rahatlatıcı bahçe müziği (loop)
- Satisfying match sesleri (pop, ding, woosh)
- Combo'da artan tempo
- Bölüm geçiş fanfar

---

## 📱 Teknik

- **Framework**: Expo + React Native
- **3D**: react-three-fiber + drei + expo-gl
- **State**: Zustand
- **Backend**: Supabase (leaderboard, cloud save, events)
- **IAP**: RevenueCat
- **Push**: expo-notifications
- **Analytics**: PostHog veya Mixpanel

---

## 🚀 MVP Scope (Phase 1)

1. Match-3 core gameplay (50 seviye)
2. 3D bahçe sahnesi (temel dekorasyon)
3. Altın + Elmas ekonomisi
4. 3 booster tipi
5. Günlük giriş ödülü + can sistemi
6. IAP (3 paket)
7. Temel UI/UX

### Phase 2 (Post-launch)
- Sosyal özellikler (liderboard, arkadaş)
- Sezon kartı (battle pass)
- Haftalık etkinlikler
- 200+ yeni seviye
- Yeni çiçek/tema paketleri
