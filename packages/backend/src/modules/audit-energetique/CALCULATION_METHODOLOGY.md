# Méthodologie de Calcul - Audit Énergétique

Ce document détaille la méthodologie complète de calcul des indicateurs énergétiques retournés par l'API d'audit énergétique.

---

## 📊 Vue d'Ensemble des Indicateurs Calculés

L'API calcule et retourne les indicateurs suivants :

1. **Consommation Énergétique**
   - Consommation annuelle totale (kWh/an)
   - Consommation mensuelle moyenne (kWh/mois)

2. **Émissions de CO₂**
   - Émissions annuelles en kg CO₂
   - Émissions annuelles en tonnes CO₂

3. **Classement Énergétique** (bureaux uniquement)
   - BECTh (kWh/m².an)
   - Classe énergétique (1 à 8)
   - Description de la performance

4. **Coût Énergétique**
   - Coût annuel estimé (TND)

---

## 1️⃣ Calcul de la Consommation Énergétique

### Données d'Entrée (Section 1 : Données Générales)
- Type de bâtiment
- Surface (SHAB, m²)
- Nombre d'étages
- Heures d'ouverture / jour
- Jours d'ouverture / semaine
- Isolation (faible / moyenne / bonne)
- Vitrage (simple / double)
- VMC (aucune / simple flux / double flux)

### Facteurs Techniques

#### Facteur d'Enveloppe
```
F_isolation : 
  - Faible   → 1.20
  - Moyenne  → 1.00
  - Bonne    → 0.90

F_vitrage :
  - Simple vitrage  → 1.10
  - Double vitrage  → 1.00

F_VMC :
  - Aucune VMC      → 1.00
  - Simple flux     → 1.05
  - Double flux     → 0.95

F_enveloppe = F_isolation × F_vitrage × F_VMC
```

#### Facteur de Compacité
```
F_compacité :
  - 1 étage         → 1.00
  - 2-3 étages      → 0.95
  - ≥4 étages       → 0.90
```

#### Facteur d'Usage
```
F_usage = (Heures/jour × Jours/semaine × 52) / 8760

Exemple : 8h/j × 6j/sem = (8 × 6 × 52) / 8760 = 0.285 (28.5% de l'année)
```

#### Facteur de Climatisation (couverture)
```
F_clim_surf :
  - Quelques pièces (<30%)              → 0.3
  - Environ la moitié (30-70%)          → 0.6
  - Presque tout le bâtiment (>70%)     → 1.0
```

#### Facteur de Process
```
Type de bâtiment                      F_process
────────────────────────────────────────────────
Bureau, école, clinique, pharmacie       1.0
Café, spa, esthétique, atelier léger     1.3
Textile, plastique, métallique, agro     1.6
```

### Facteurs Climatiques (Section 2)

```
Zone           F_ch   F_fr   w_hiver  w_été  w_mi
──────────────────────────────────────────────────
Nord côtier    0.95   1.05   0.30     0.50   0.20
Intérieur      1.10   0.95   0.40     0.40   0.20
Sud            0.90   1.10   0.20     0.55   0.25
```

### Calcul HVAC avec Horaires

Les systèmes HVAC fonctionnent pendant les heures d'usage avec un fond de charge :

```
k_ch (chauffage) = 0.30
k_fr (climatisation) = 0.20

F*_ch = k_ch + (1 - k_ch) × F_usage
F*_fr = k_fr + (1 - k_fr) × F_usage
```

### Coefficients par Type de Bâtiment

```
Type de bâtiment             C_HVAC  C_light  C_IT  C_base  ECS_utile
────────────────────────────────────────────────────────────────────────
🧴 Pharmacie                    70      14      25     8        3
☕ Café / Restaurant             90      22      30    10       18
💅 Centre esthétique / Spa      80      18      30     8       12
🏨 Hôtel / Maison d'hôtes      110      18      28    10       25
🏥 Clinique                    110      18      28    10       22
🏢 Bureau / Administration      65      14      25     8        3
🧰 Atelier léger                55      10      20     5        3
🏭 Usine lourde                 45       8      30     5        3
🧵 Industrie textile            50      12      35     6        3
🧃 Industrie alimentaire        55      15      40     8        8
🧫 Industrie plastique          60      12      45     8        4
❄️ Agro réfrigérée              70      10      40    10        6
🏫 École                        60      12      15     6        5
```

### Formules de Calcul

```
Base_HVAC = C_HVAC(type) × F_enveloppe × F_compacité

C_ch = Base_HVAC × (w_hiver×F_ch×F*_ch + 0.5×w_mi×F_ch×F*_ch)
C_fr = Base_HVAC × (w_été×F_fr×F*_fr + 0.5×w_mi×F_fr×F*_fr)

C_HVAC_adj = (C_ch + C_fr) × F_clim_surf

C_light = C_light(type) × F_usage

C_IT = C_IT(type) × F_usage × F_process

C_base = C_base(type)

C_equip = Σ(Forfaits équipements × F_usage × F_process)

ECS_finale = ECS_utile(type) × F_ECS_usage / η_système

C_total = C_HVAC_adj + C_light + C_IT + C_base + C_equip + ECS_finale

E_total = SHAB × C_total
```

### Forfaits Équipements

```
Catégorie                  Forfait (kWh/m².an)  Facteur temps
─────────────────────────────────────────────────────────────
Éclairage / IT                  déjà inclus           -
Froid commercial                    30            F_usage × F_process
Cuisine / cuisson                   25            F_usage × F_process
Autres équipements                  10            F_usage × F_process
Machines production                 40            F_usage × F_process
Compresseurs                        25            F_usage × F_process
Pompes / convoyeurs                 15            F_usage × F_process
Froid industriel                    60            1 (24/7)
Équipements auxiliaires              8            F_usage × F_process
```

### Cas Spécial : Pharmacies

Froid 24/7 fonction de la surface :

```
SHAB ≤ 40 m²   → 2 frigos + 1 vitrine → 4,818 kWh/an
41–80 m²       → 3 frigos + 1 vitrine → 6,132 kWh/an
81–120 m²      → 4 frigos + 1 vitrine → 7,446 kWh/an
>120 m²        → 5 frigos + 2 vitrines → 10,950 kWh/an
```

### Facteur d'Usage ECS

```
Type de bâtiment                    F_ECS_usage
───────────────────────────────────────────────
Faible (bureau, école, pharmacie)      0.7
Moyen (café, clinique, hôtel)          1.0
Élevé (spa, hammam, esthétique)        1.4
```

### Rendement Système ECS

```
Type système         η_système   Formule
────────────────────────────────────────────────
⚡ Électrique           1.00      ECS_utile / 1.00
🔥 Gaz                  0.92      ECS_utile / 0.92
☀️ Solaire              0.70*     0.70 × (ECS_utile / 0.92)
💧 PAC                  3.00      ECS_utile / 3.00

* 70% couvert par le soleil, 30% par appoint gaz
```

---

## 2️⃣ Calcul des Émissions de CO₂

### Méthodologie

Les émissions de CO₂ proviennent de deux sources :
1. Électricité (réseau STEG)
2. Gaz naturel

### Facteurs d'Émission

```
Source            Facteur d'émission
──────────────────────────────────────
Électricité       0.512 kg CO₂/kWh
Gaz naturel       0.202 kg CO₂/kWh
```

### Répartition Électricité/Gaz

Le système sépare automatiquement la consommation selon :

**Consommation Gaz** :
- Chauffage par chaudière gaz
- ECS par chaudière gaz

**Consommation Électricité** :
- Tout le reste (éclairage, IT, équipements, climatisation, etc.)

### Formules

```
E_gaz = Chauffage_gaz + ECS_gaz

E_elec = E_total - E_gaz

CO₂_gaz = E_gaz × 0.202 kg/kWh

CO₂_elec = E_elec × 0.512 kg/kWh

CO₂_total = CO₂_gaz + CO₂_elec
```

### Exemple de Calcul

```
Bâtiment : Hôtel 1200 m²
Consommation totale : 125,678 kWh/an
Chauffage gaz : 35,000 kWh/an
ECS gaz : 15,000 kWh/an

E_gaz = 35,000 + 15,000 = 50,000 kWh/an
E_elec = 125,678 - 50,000 = 75,678 kWh/an

CO₂_gaz = 50,000 × 0.202 = 10,100 kg/an
CO₂_elec = 75,678 × 0.512 = 38,747 kg/an
CO₂_total = 48,847 kg/an = 48.85 tonnes/an
```

---

## 3️⃣ Classement Énergétique (BECTh)

### Applicabilité

⚠️ **IMPORTANT** : Le classement énergétique s'applique **UNIQUEMENT** aux bâtiments de type :
- 🏢 **Bureau / Administration / Banque**

Pour tous les autres types de bâtiments, ces champs sont `null` ou `undefined`.

### Définition du BECTh

**BECTh** : Besoins Énergétiques liés au Confort Thermique

```
BECTh = (BECh + BERef) / STC

Où :
- BECh   : Besoins énergétiques annuels pour le chauffage (kWh/an)
- BERef  : Besoins énergétiques annuels pour le refroidissement (kWh/an)
- STC    : Surface Totale Conditionnée (m²)
```

### Calcul de la Surface Conditionnée

```
STC = SHAB × F_clim_surf

Où F_clim_surf dépend de la couverture :
- Quelques pièces              → 0.3
- Environ la moitié            → 0.6
- Presque tout le bâtiment     → 1.0
```

### Exemple de Calcul

```
Bureau de 500 m²
Couverture : "Presque tout le bâtiment" (100%)

C_ch = 28.5 kWh/m².an
C_fr = 18.2 kWh/m².an

BECh = 28.5 × 500 = 14,250 kWh/an
BERef = 18.2 × 500 = 9,100 kWh/an
STC = 500 × 1.0 = 500 m²

BECTh = (14,250 + 9,100) / 500 = 46.7 kWh/m².an

→ Classe 1 (Excellente performance)
```

### Barème de Classification

```
Classe   BECTh (kWh/m².an)   Interprétation
────────────────────────────────────────────────────
  1         ≤ 75             Excellente performance
  2       75 < x ≤ 85        Très bonne performance
  3       85 < x ≤ 95        Bonne performance
  4       95 < x ≤ 105       Performance moyenne
  5      105 < x ≤ 125       Performance faible
  6      125 < x ≤ 150       Mauvaise performance
  7      150 < x ≤ 180       Très mauvaise performance
  8         > 180            Performance critique
```

---

## 4️⃣ Consommation Mensuelle

Simple moyenne arithmétique :

```
E_mensuel = E_total / 12
```

⚠️ **Note** : Il s'agit d'une moyenne. La consommation réelle varie selon les saisons :
- Plus élevée en hiver (chauffage) et été (climatisation)
- Plus faible en mi-saison

---

## 🔍 Points Importants

### 1. Précision des Calculs
- Tous les résultats sont arrondis à 2 décimales pour la consommation
- Les émissions CO₂ sont exprimées en kg (2 décimales) et tonnes (3 décimales)

### 2. Valeurs par Défaut
Certains paramètres peuvent être configurés via variables d'environnement :
- `ENERGY_AUDIT_K_CH` : Fond de charge chauffage (défaut: 0.3)
- `ENERGY_AUDIT_K_FR` : Fond de charge climatisation (défaut: 0.2)
- `ENERGY_COST_PER_KWH` : Coût du kWh (défaut: 0.35 TND)

### 3. Validation des Données
- Toutes les entrées sont vérifiées via les utilitaires de validation TypeScript du controller
- Les enums assurent la cohérence des valeurs

### 4. Évolutivité
L'architecture Clean permet d'ajouter facilement :
- De nouveaux types de bâtiments
- De nouvelles zones climatiques
- De nouveaux systèmes énergétiques
- Des calculs supplémentaires

---

## 📚 Références

- Réglementation thermique tunisienne
- Guide ANME (Agence Nationale pour la Maîtrise de l'Énergie)
- Facteurs d'émission STEG
- Normes de construction tunisiennes

---

## 📝 Historique des Versions

### Version 1.1.0 (Décembre 2024)
- ✅ Ajout consommation mensuelle
- ✅ Ajout émissions CO₂
- ✅ Ajout classement énergétique (bureaux)
- ✅ Séparation électricité/gaz

### Version 1.0.0 (Novembre 2024)
- Calcul consommation annuelle
- Calcul coût énergétique

