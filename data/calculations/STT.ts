export interface CalculationData {
  id: string;
  title: string;
  content: string;
}

export const STT_CALCULATIONS: CalculationData[] = [
  {
    id: 'strizna-sila',
    title: 'Výpočet střižné síly',
    content: `Tento dokument obsahuje technický výpočet celkové síly potřebné k prostřižení ocelového plechu s definovanými rozměry a otvorem na základě dodaných podkladů.

### 1. Vstupní parametry a geometrie

![Schéma střižné síly](/stt_calculations/strizna_sila.png)

- Strana čtverce (a): 40 mm
- Průměr otvoru (d): 20 mm
- Tloušťka materiálu (s): 4 mm
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
    content: `Tento technický dokument obsahuje podrobný výpočet rozvinuté délky polotovaru pro součást vyráběnou ohýbáním. Výpočet zohledňuje geometrii rovných úseků, poloměry ohybů a tloušťku materiálu s uvážením polohy neutrální osy.

### 1. Vstupní parametry a geometrie

Pro výpočet byly stanoveny následující hodnoty na základě technické dokumentace:

![Schéma ohýbání](/stt_calculations/ohybeni.png)

- Délka úseku 1 (A): 40 mm
- Délka úseku 2 (B): 50 mm
- Délka úseku 3 (C): 20 mm
- Délka úseku 4 (D): 25 mm
- Poloměr ohybu (R): 4 mm
- Tloušťka materiálu (s): 4 mm
- Úhel sevření (α): 150°

### 2. Stanovení neutrální osy

Při ohýbání dochází k deformaci materiálu. Pro přesný výpočet je nutné určit polohu neutrální osy pomocí součinitele x, který závisí na poměru R/s.

Výpočet poměru:
R / s = 4 / 4 = 1,0

Z tabulkových hodnot pro poměr 1,0 vyplývá hodnota součinitele x = 0,42.

Výpočet poloměru neutrální osy (R0):
R0 = R + x · s
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
  }
];
