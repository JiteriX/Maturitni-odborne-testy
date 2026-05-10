export interface CalculationData {
  id: string;
  title: string;
  content: string;
}

export const STT_CALCULATIONS: CalculationData[] = [
  {
    id: 'strizna-sila',
    title: 'Výpočet střižné síly',
    content: `**⚠️ Upozornění: Tento výpočet by se na maturitním testu neměl objevit.**\n\nTento dokument obsahuje technický výpočet celkové síly potřebné k prostřižení ocelového plechu s definovanými rozměry a otvorem na základě dodaných podkladů.

### 1. Vstupní parametry a geometrie

![Schéma střižné síly](/images/stt_calculations/strizna_sila.png)

- Strana čtverce (a): 40 mm
- Průměr otvoru (d): 20 mm
- Tloušťka materiálu (t): 4 mm
- Materiál: 11 373 (konstrukční ocel)

### 2. Materiálové charakteristiky

- Mez pevnosti v tahu (Rm): 440 MPa (pro ocel 11 373 se uvažuje rozmezí 340–440 MPa)
- Výpočet meze pevnosti ve střihu: Rms = Rm × 0,8 = 440 × 0,8 = 352 MPa

### 3. Výpočet střižné plochy (S)

Celková střižná plocha je definována jako součet obvodu všech stříhaných hran (vnější čtverec a vnitřní kruh) vynásobený tloušťkou materiálu.

S = Skruh + Sčtverec
S = (2πr × t) + (4a × t)
S = (2π × 10 × 4) + (4 × 40 × 4)
S = 251,33 + 640
S = 891,3 mm2

### 4. Výpočet celkové střižné síly (Fs)

Výsledná síla potřebná k překonání odporu materiálu se vypočte jako součin celkové střižné plochy a meze pevnosti ve střihu.

Fs = S × Rms
Fs = 891,3 × 352
Fs = 313 748,16 N

### 5. Závěr

Na základě výpočtu byla stanovena celková střižná síla 313 748 N, což po zaokrouhlení činí přibližně 313,75 kN.`
  },
  {
    id: 'rozvinuta-delka',
    title: 'Výpočet ohýbání',
    content: `**✅ Upozornění: Tento typ výpočtu se může objevit na maturitním testu.**\n\nTento technický dokument obsahuje podrobný výpočet rozvinuté délky polotovaru pro součást vyráběnou ohýbáním. Výpočet zohledňuje geometrii rovných úseků, poloměry ohybů a tloušťku materiálu s uvážením polohy neutrální osy.

### 1. Vstupní parametry a geometrie

Pro výpočet byly stanoveny následující hodnoty na základě technické dokumentace:

![Schéma ohýbání](/images/stt_calculations/ohybeni.png)

- Délka úseku 1 (A): 40 mm
- Délka úseku 2 (B): 50 mm
- Délka úseku 3 (C): 20 mm
- Délka úseku 4 (D): 25 mm
- Poloměr ohybu (R): 4 mm
- Tloušťka materiálu (t): 4 mm
- Úhel sevření (α): 150°

### 2. Stanovení neutrální osy

Při ohýbání dochází k deformaci materiálu. Pro přesný výpočet je nutné určit polohu neutrální osy pomocí součinitele x, který závisí na poměru R/t.

Výpočet poměru:
R / t = 4 / 4 = 1,0

Z tabulkových hodnot pro poměr 1,0 vyplývá hodnota součinitele x = 0,42.

Výpočet poloměru neutrální osy (R0):
R0 = R + x · t
R0 = 4 + 0,42 · 4 = 5,68 mm

### 3. Výpočet délek ohybů

Délky oblouků se počítají podle úhlů ohybu. Součást má dva ohyby o 90° a jeden ohyb odpovídající úhlu sevření.

- Ohyb 1 a 2 (β = 90°):
Lo1 = Lo2 = (2π · R0 / 360) · 90 = 8,92 mm

- Ohyb 3 (β = 180° - 150° = 30°):
Lo3 = (2π · R0 / 360) · 30 = 2,97 mm

### 4. Celková rozvinutá délka

Celková délka Lc je součtem všech přímých úseků a délek všech oblouků:

Lc = A + B + C + D + Lo1 + Lo2 + Lo3
Lc = 40 + 50 + 20 + 25 + 8,92 + 8,92 + 2,97
Lc = 155,81 mm

### 5. Specifikace polotovaru

Na základě výsledku a normy ČSN 42 6510 je doporučen následující polotovar:
KR 4 - 156 (Kruhová ocel, průměr 4 mm, délka 156 mm).`
  },
  {
    id: 'soustruzeni-rezne-podminky',
    title: 'Řezné podmínky pro soustružení',
    content: `**✅ Upozornění: Tento typ výpočtu se může objevit na maturitním testu.**\n\nTento dokument shrnuje technologické výpočty pro obrábění stupňovitého hřídele, včetně stanovení řezných podmínek a výpočtu celkového strojního času na základě předložené technické dokumentace.

### 1. Zadání a specifikace obrobku

![Schéma soustružení](/images/stt_calculations/rezne_podminky.png)

- Materiál nástroje: P10
- Poloměr špičky nože (rε): 1 mm
- Výchozí polotovar: Tyč ø 70 mm x 90 mm

Rozměry a parametry jednotlivých úseků:
- Úsek 1: Výsledný průměr 61 mm, délka obrábění 70 mm, požadovaná drsnost Ra 1,6.
- Úsek 2: Výsledný průměr 46 mm, délka obrábění 46 mm, požadovaná drsnost Ra 3,2.
- Celková délka hřídele: 90 mm.

### 2. Stanovení a výpočet řezných podmínek

Úsek 1: Soustružení z ø 70 mm na ø 61 mm
Pro dosažení výsledného průměru je nutné odebrat celkem 4,5 mm materiálu na poloměru. Při zvoleném záběru 1,5 mm na jednu třísku bude proces rozdělen do tří průchodů.

- Hloubka řezu (a1): (70 mm - 61 mm) / 2 = 4,5 mm
- Počet záběrů (i1): 4,5 mm / 1,5 mm = 3 záběry

Na základě tabulkových hodnot pro drsnost Ra 1,6 a materiál P10 byly zvoleny následující parametry:
- Řezná rychlost (v1): 219 m/min
- Posuv (f1): 0,11 mm/ot

Výpočet otáček vřetene (n1):
n1 = (1000 × v1) / (π × D1)
n1 = (1000 × 219) / (π × 70) = 995,86 ≈ 1000 ot/min

Výsledky pro 1. úsek:
- v1 = 219 m/min
- f1 = 0,11 mm/ot
- n1 = 1000 ot/min
- i1 = 3 

Úsek 2: Soustružení z ø 61 mm na ø 46 mm
V tomto úseku je celkový přídavek na poloměru 7,5 mm. Při zachování hloubky řezu 1,5 mm je zapotřebí pěti průchodů nástroje.

- Hloubka řezu (a2): (61 mm - 46 mm) / 2 = 7,5 mm
- Počet záběrů (i2): 7,5 mm / 1,5 mm = 5 záběrů

Parametry zvolené pro drsnost Ra 3,2:
- Řezná rychlost (v2): 199 m/min
- Posuv (f2): 0,18 mm/ot

Výpočet otáček vřetene (n2):
n2 = (1000 × v2) / (π × D2)
n2 = (1000 × 199) / (π × 61) = 1038,4 ≈ 1050 ot/min

Výsledky pro 2. úsek:
- v2 = 199 m/min
- f2 = 0,18 mm/ot
- n2 = 1050 ot/min
- i2 = 5

### 3. Výpočet celkového strojního času (tas)

Strojní čas představuje čistou dobu práce nástroje v záběru. Výpočet zohledňuje délku úseků, otáčky, posuv a počet opakování (záběrů).

1. úsek (ø 61 mm):
- Výpočetní vzorec: ts1 = [L1 / (n1 × f1)] × i1
- Výpočet: ts1 = [70 / (1000 × 0,11)] × 3
- Čas: 114 s (ts1)

2. úsek (ø 46 mm):
- Výpočetní vzorec: ts2 = [L2 / (n2 × f2)] × i2
- Výpočet: ts2 = [46 / (1050 × 0,18)] × 5
- Čas: 72 s (ts2)

Celkový strojní čas (ts = ts1 + ts2): 186 s

Celková doba obrábění obou stupňů hřídele činí 186 sekund (tedy 3 minuty a 6 sekund).`
  },
  {
    id: 'tazeni-vytazku',
    title: 'Tažení výtažku',
    content: `**✅ Upozornění: Tento typ výpočtu se může objevit na maturitním testu.**\n\nTento dokument shrnuje výpočet pro stanovení rozměrů výchozího polotovaru (rondelu) a počtu technologických kroků (tahů) potřebných k výrobě hlubokotažné válcové nádoby.

### 1. Vstupní parametry nádoby

![Schéma tažení](/images/stt_calculations/tazeni.png)

- Vnější průměr (D): 100 mm
- Výška (H): 160 mm
- Tloušťka plechu (t): 0,8 mm

### 2. Výpočet rozměru polotovaru (Rondelu)

Výpočet vychází ze zákona zachování objemu (V_rondelu = V_nádoby). Nádoba je počítána jako rozdíl dvou válců (vnějšího a vnitřního).

Objem materiálu nádoby (V):
- Vnější válec (V1): V1 = (π × D² / 4) × H = (π × 100² / 4) × 160 = 1 256 637,1 mm³
- Vnitřní válec (V2): V2 = (π × d² / 4) × h = 1 210 662,6 mm³
- Čistý objem materiálu: V = V1 - V2 = 45 974,5 mm³

Průměr rondelu (DR):
- V_rondelu = (π × DR² / 4) × t = 45 974,5 mm³
- DR = √((45 974,5 × 4) / (π × 0,8))
- DR = 270,5 mm

### 3. Určení počtu tahů

Postupný výpočet průměrů v jednotlivých tazích:

Základní relativní tloušťka pro 1. tah:
(t / DR) × 100 = (0,8 / 270,5) × 100 = 0,29  
Hodnota 0,29 spadá do rozmezí 0,3 – 0,15, proto volíme součinitel m1 = 0,59.

**1. Tah:**
- dT1 = m1 × DR
- dT1 = 0,59 × 270,5
- dT1 = 159,6 mm

**2. Tah:**
- m2 = (t / dT1) × 100
- m2 = (0,8 / 159,6) × 100 = 0,50
- Z tabulky volíme m2 = 0,78 (pro sloupec 0,6–0,3)
- dT2 = m2 × dT1
- dT2 = 0,78 × 159,6
- dT2 = 124,5 mm

**3. Tah:**
- m3 = (t / dT2) × 100
- m3 = (0,8 / 124,5) × 100 = 0,64
- Z tabulky volíme m3 = 0,80
- dT3 = m3 × dT2
- dT3 = 0,80 × 124,5
- dT3 = 99,6 mm

### 4. Závěr

Po 3. tahu se dostaneme na ∅ 99,6 mm, což je méně než D = 100 mm.  
K výrobě jsou potřeba 3 tahy.`
  }
];
