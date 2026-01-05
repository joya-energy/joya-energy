# File Storage Configuration

Ce document explique comment configurer le stockage des fichiers PDF générés par l'application JOYA.

## Architecture

L'application utilise une architecture de stockage moderne :

1. **Génération** : Les PDFs sont générés en mémoire
2. **Stockage** : Upload vers un service de stockage cloud (Google Cloud Storage recommandé)
3. **Métadonnées** : Stockage des informations de fichier en base de données MongoDB
4. **Accès** : URLs signées pour les fichiers stockés

## Configuration Google Cloud Storage (Recommandé)

### Pourquoi Google Cloud Storage ?

- ✅ **Déjà configuré** : Vous utilisez déjà Google Maps, donc vous avez un compte GCP
- ✅ **Fiabilité** : 99.95%+ SLA (vs 99.9% pour OVH)
- ✅ **Performance** : Réseau optimisé depuis l'Europe
- ✅ **Prix compétitif** : ~$0.023/GB/mois (Régional Europe)
- ✅ **Intégration** : Console unifiée avec vos autres services Google

### 1. Accéder à Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet existant (celui utilisé pour Google Maps)

### 2. Activer Cloud Storage API

1. Dans la console, allez dans `APIs & Services > Library`
2. Recherchez "Cloud Storage"
3. Activez "Cloud Storage JSON API"

### 3. Créer un bucket

1. Allez dans `Cloud Storage > Buckets`
2. Cliquez "Create bucket"
3. Configurez :
   - **Nom** : `joya-audit-reports`
   - **Région** : `europe-west1` (Paris - pour de meilleures performances)
   - **Classe de stockage** : `Standard`
   - **Contrôle d'accès** : `Uniform` (privé)

### 4. Créer un compte de service

1. Allez dans `IAM & Admin > Service Accounts`
2. Cliquez "Create service account"
3. Donnez un nom : `joya-storage-service`
4. Rôle : `Storage Object Admin`
5. Créez et téléchargez la clé JSON

### 5. Configuration des variables d'environnement

```bash
STORAGE_TYPE=gcp
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=joya-audit-reports
GOOGLE_CLOUD_KEY_FILENAME=/path/to/service-account-key.json
GOOGLE_CLOUD_REGION=europe-west1
```

## Comparaison Prix

| Service | Prix/GB/mois | SLA | Avantages |
|---------|-------------|-----|-----------|
| **Google Cloud Storage** | $0.023 (Europe) | 99.95% | Fiable, intégré, scaling automatique |
| **OVH Object Storage** | €0.01-0.015 | 99.9% | Européen, prix bas |
| **AWS S3** | $0.023 | 99.99% | Ultra-fiable, global |

## Configuration OVH (Alternative)

### 1. Créer un compte OVH Object Storage

1. Connectez-vous à votre [espace client OVH](https://www.ovh.com/manager/)
2. Allez dans `Storage > Object Storage`
3. Créez un nouveau conteneur (bucket)
4. Notez le nom du bucket et la région

### 2. Générer les clés d'accès

1. Dans Object Storage, allez dans `Users & Roles`
2. Créez un utilisateur avec les permissions `ObjectStore operator`
3. Notez l'Access Key et Secret Key

### 3. Configuration des variables d'environnement

```bash
# Type de stockage
STORAGE_TYPE=ovh

# OVH Object Storage
OVH_ACCESS_KEY_ID=votre-access-key
OVH_SECRET_ACCESS_KEY=votre-secret-key
OVH_BUCKET_NAME=joya-audit-reports
OVH_REGION=gra  # Région OVH : gra, sbg, bhs, etc.
```

## Alternatives de stockage

### AWS S3

```bash
STORAGE_TYPE=aws
AWS_ACCESS_KEY_ID=votre-access-key
AWS_SECRET_ACCESS_KEY=votre-secret-key
AWS_S3_BUCKET_NAME=joya-audit-reports
AWS_REGION=us-east-1
```

### Stockage Local (Développement uniquement)

```bash
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./storage
```

⚠️ **Le stockage local n'est pas recommandé pour la production**

## Migration des fichiers existants

Si vous avez des PDFs dans le dossier `exports/`, vous pouvez :

1. Les uploader manuellement vers votre service de stockage
2. Créer les entrées correspondantes en base de données
3. Ou utiliser le script de nettoyage :

```bash
npm run cleanup-exports
```

## API Endpoints

### Récupérer les métadonnées d'un fichier
```
GET /api/files/:id
```

### Récupérer l'URL de téléchargement
```
GET /api/files/:id/url?expiresIn=3600
```

### Lister les fichiers d'un audit
```
GET /api/files/audit/:auditId
```

### Lister les fichiers d'une simulation solaire
```
GET /api/files/simulation/:simulationId
```

### Supprimer un fichier
```
DELETE /api/files/:id
```

## Structure de la base de données

```typescript
interface IFile {
  id: string;
  fileName: string;        // Nom technique
  originalName: string;    // Nom original
  mimeType: string;
  size: number;
  storageKey: string;      // Clé dans le stockage cloud
  storageUrl: string;      // URL d'accès direct
  folder: string;          // Dossier (audit-reports, pv-reports)
  auditId?: string;        // Référence audit énergétique
  simulationId?: string;   // Référence simulation solaire
  uploadedBy?: string;
  createdAt: Date;
  expiresAt?: Date;
}
```

## Avantages de cette architecture

- ✅ **Évolutivité** : Pas de limite de stockage sur le serveur
- ✅ **Performance** : URLs directes, pas de proxy via l'API
- ✅ **Fiabilité** : Stockage redondant et durable
- ✅ **Coût** : Tarifs avantageux pour le stockage objet
- ✅ **Sécurité** : Fichiers isolés du code applicatif

## Migration depuis l'ancien système

L'ancien système stockait les PDFs dans `packages/backend/exports/`. Le nouveau système :

1. Génère les PDFs en mémoire
2. Les upload immédiatement vers le stockage cloud
3. Sauvegarde les métadonnées en base
4. Retourne l'URL d'accès direct

Les anciens fichiers peuvent être nettoyés avec le script fourni.
