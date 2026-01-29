# Quick Start Guide - Module Comparaison de Financements

## 🚀 Démarrage Rapide

### 1. Installation (si nécessaire)

```bash
# Root du projet
npm install

# Backend
cd packages/backend
npm install

# Frontend
cd packages/frontend
npm install
```

### 2. Configuration Backend

Assurez-vous que votre fichier `.env` contient :

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/joya
NODE_ENV=development
```

### 3. Démarrer le Backend

```bash
cd packages/backend
npm run dev
```

Le serveur démarrera sur `http://localhost:3000`

### 4. Démarrer le Frontend

```bash
cd packages/frontend
npm start
```

L'application sera accessible sur `http://localhost:4200`

---

## 🧪 Test Manuel de l'API

### Test 1 : Créer une comparaison avec taille en kWp

```bash
curl -X POST http://localhost:3000/api/financial-comparisons \
  -H "Content-Type: application/json" \
  -d '{
    "location": "tunis",
    "installationSizeKwp": 50
  }'
```

### Test 2 : Créer une comparaison avec budget

```bash
curl -X POST http://localhost:3000/api/financial-comparisons \
  -H "Content-Type: application/json" \
  -d '{
    "location": "sousse",
    "investmentAmountDt": 125000
  }'
```

### Test 3 : Récupérer une comparaison

```bash
curl http://localhost:3000/api/financial-comparisons/{ID}
```

### Test 4 : Lister les comparaisons

```bash
curl http://localhost:3000/api/financial-comparisons?page=1&limit=10
```

---

## 🖥️ Test Manuel de l'Interface

### Scénario 1 : Comparaison par taille

1. Naviguez vers `http://localhost:4200/comparaison-financements`
2. Sélectionnez **Tunis** comme localisation
3. Choisissez le toggle **Taille (kWp)**
4. Entrez **50** kWp
5. Cliquez sur **Comparer les Solutions**
6. Vérifiez que les 4 solutions s'affichent
7. Cliquez sur chaque onglet pour voir les détails

### Scénario 2 : Comparaison par budget

1. Sélectionnez **Sousse** comme localisation
2. Choisissez le toggle **Budget (DT)**
3. Entrez **125000** DT
4. Cliquez sur **Comparer les Solutions**
5. Vérifiez les résultats

### Scénario 3 : Navigation entre solutions

1. Lancez une comparaison
2. Cliquez sur chaque solution (Comptant, Crédit, Leasing, ESCO)
3. Vérifiez que le badge "Meilleur Cashflow" s'affiche correctement
4. Vérifiez les avantages/inconvénients
5. Cliquez sur **Nouvelle Comparaison** pour revenir au formulaire

---

## 🔍 Points de Vérification

### Backend
- ✅ Le serveur démarre sans erreur
- ✅ La route `/api/financial-comparisons` est accessible
- ✅ Les calculs sont corrects
- ✅ La base de données enregistre les comparaisons
- ✅ Les logs sont informatifs

### Frontend
- ✅ La page se charge correctement
- ✅ Le formulaire fonctionne avec validation
- ✅ Les résultats s'affichent après soumission
- ✅ Les onglets de solutions fonctionnent
- ✅ Le design est responsive (testez sur mobile)
- ✅ Les animations sont fluides
- ✅ Le bouton "Nouvelle Comparaison" réinitialise l'état

---

## 📊 Résultats Attendus

Pour un projet de **50 kWp à Tunis** :

- **CAPEX** : 125,000 DT
- **Production annuelle** : ~82,500 kWh
- **Économies mensuelles** : ~1,237 DT

### Cashflows mensuels attendus :
- **Comptant** : ~1,081 DT (le plus élevé après investissement initial)
- **Crédit** : ~400-500 DT
- **Leasing** : ~200-300 DT
- **ESCO** : ~300-400 DT (avec 0 DT d'investissement initial)

---

## 🐛 Dépannage

### Erreur : "Cannot find module"
```bash
# Réinstallez les dépendances
npm install
```

### Erreur : "Port already in use"
```bash
# Changez le port dans .env ou tuez le processus
lsof -ti:3000 | xargs kill -9
```

### Erreur : "MongoDB connection failed"
```bash
# Vérifiez que MongoDB est lancé
# Windows : démarrez le service MongoDB
# Mac/Linux : brew services start mongodb-community
```

### L'interface ne charge pas
```bash
# Vérifiez que le backend est bien lancé
curl http://localhost:3000/api/financial-comparisons

# Vérifiez la configuration de l'API URL
# frontend/src/environments/environment.ts
```

---

## 🎯 Scénarios de Test Avancés

### Test des validations

1. **Essayez sans localisation** : Erreur attendue
2. **Essayez avec taille négative** : Validation échouée
3. **Essayez avec les deux champs remplis** : Erreur backend

### Test des différentes localisations

Testez avec chaque ville pour vérifier les rendements :
- Tunis : 1650 kWh/kWp/an
- Tozeur : 1760 kWh/kWp/an (meilleur)
- Bizerte : 1630 kWh/kWp/an (plus faible)

### Test responsive

1. Ouvrez les DevTools (F12)
2. Activez le mode responsive
3. Testez sur iPhone, iPad, Desktop
4. Vérifiez que tout est lisible et fonctionnel

---

## 📝 Notes de Test

### Ce qui devrait fonctionner :
- ✅ Tous les calculs sont précis
- ✅ Les 4 solutions sont toujours affichées
- ✅ Le meilleur cashflow est automatiquement identifié
- ✅ Les données persistent en base MongoDB
- ✅ L'interface est réactive et fluide
- ✅ Les erreurs sont gérées avec des messages clairs

### Limitations connues :
- Pas encore d'export PDF
- Pas de graphiques d'évolution
- Pas de sauvegarde d'historique utilisateur
- Pas de personnalisation des paramètres

---

## 🎉 Félicitations !

Si tout fonctionne, vous avez maintenant un module complet de comparaison de financements solaires ! 

**Prochaines étapes** :
1. Ajouter des tests unitaires
2. Implémenter l'export PDF
3. Créer des graphiques de visualisation
4. Ajouter l'analyse de sensibilité

---

**Besoin d'aide ?** Consultez le README dans `packages/backend/src/modules/comparaison-financements/README.md`

