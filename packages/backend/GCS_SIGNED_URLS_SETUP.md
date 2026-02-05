# 🔐 Configuration Google Cloud Storage (GCS)

Ce guide explique comment configurer l’upload des PDFs vers GCS (local et production / Railway).

--- yes

## 🚀 Railway / Production : clé JSON dans une variable d’environnement (recommandé)

Sur **Railway** (ou tout hébergeur non-GCP), il n’y a pas de “metadata server” Google. Il faut fournir une **clé de compte de service** (JSON).

### 1. Créer ou utiliser un compte de service GCP

1. Ouvrez [Google Cloud Console](https://console.cloud.google.com/) → projet **elite-name-482012-d1** (ou le vôtre).
2. **IAM et administration** → **Comptes de service**.
3. Utilisez le compte existant `joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com` ou créez-en un nouveau.
4. Vérifiez qu’il a au moins le rôle **Storage Object Admin** sur le bucket (ou sur le projet) :
   - **Stockage** → votre bucket (ex. `joya-pdf-storage`) → **Autorisations**, ou
   - **IAM** → attachez `roles/storage.objectAdmin` au compte de service.

### 2. Télécharger une clé JSON

1. Dans **Comptes de service**, cliquez sur le compte (ex. `joya-backend-803`).
2. Onglet **Clés** → **Ajouter une clé** → **Créer une clé** → **JSON**.
3. Le fichier JSON est téléchargé (ex. `elite-name-482012-d1-xxxx.json`). **Ne le commitez jamais.**

### 3. Configurer Railway

1. Ouvrez le contenu du fichier JSON (un seul objet JSON sur une ou plusieurs lignes).
2. **Mettez-le sur une seule ligne** : supprimez les retours à la ligne à l’intérieur de la chaîne `private_key` (gardez `\n` pour les sauts de ligne dans la clé).
3. Dans **Railway** → votre service backend → **Variables** :
   - **GCS_BUCKET_NAME** = `joya-pdf-storage` (ou le nom de votre bucket).
   - **GCS_SERVICE_ACCOUNT_JSON** = tout le JSON en une seule ligne (coller la valeur).

Exemple (tronqué) :

```env
GCS_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"elite-name-482012-d1","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n","client_email":"joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com",...}
```

4. Redéployez le backend. Dans les logs vous devriez voir :  
   `✅ GCS initialized with credentials from GCS_SERVICE_ACCOUNT_JSON`

### 4. Alternative : même variable en local

Pour tester en local sans fichier, vous pouvez définir **GCS_SERVICE_ACCOUNT_JSON** dans `.env.development` (même format, une seule ligne). Ne commitez pas ce fichier s’il contient la clé.

---

## Option : IAM sans clé JSON (local avec gcloud)

Ce qui suit permet de configurer des **signed URLs** et l’accès GCS **sans clé JSON**, en utilisant l’impersonation et `gcloud` (surtout utile en local).

## ✅ Avantages de cette méthode (impersonation)

- ✅ **Pas de clé JSON à gérer** (respecte les politiques d'organisation)
- ✅ **Signed URLs sécurisées** avec expiration automatique
- ✅ **Bucket privé** (pas d'accès public)
- ✅ **Recommandé par Google** pour la production
- ✅ **Compatible avec les politiques d'organisation**

## 📋 Prérequis

1. Avoir un **service account** dans Google Cloud (ou demander à un admin de le créer)
2. Avoir la permission **d'impersonner** ce service account
3. `gcloud` CLI installé et authentifié

## 🚀 Étapes de configuration

### Étape 1 : Créer le Service Account (ou demander à un admin)

**Note :** Dans ce projet, nous utilisons le service account existant : `joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com`

Si vous devez créer un nouveau service account :

```bash
# Créer le service account
gcloud iam service-accounts create joya-pdf-service \
  --display-name="Joya PDF Service Account" \
  --project=elite-name-482012-d1

# Lui donner les rôles nécessaires (IMPORTANT : les 3 rôles sont nécessaires)
gcloud projects add-iam-policy-binding elite-name-482012-d1 \
  --member="serviceAccount:joya-pdf-service@elite-name-482012-d1.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"  # Pour uploader/créer des fichiers

gcloud projects add-iam-policy-binding elite-name-482012-d1 \
  --member="serviceAccount:joya-pdf-service@elite-name-482012-d1.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"  # Pour lire les fichiers

gcloud projects add-iam-policy-binding elite-name-482012-d1 \
  --member="serviceAccount:joya-pdf-service@elite-name-482012-d1.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"  # Pour signed URLs
```

**⚠️ IMPORTANT :** Le rôle `Storage Object Admin` (ou `storage.objectAdmin`) est **ESSENTIEL** pour pouvoir uploader des fichiers. Sans ce rôle, vous obtiendrez l'erreur `Permission 'storage.objects.create' denied`.

### Étape 2 : Activer l'API IAM Service Account Credentials

Cette API est nécessaire pour l'impersonation :

```bash
gcloud services enable iamcredentials.googleapis.com --project=elite-name-482012-d1
```

Ou via la console : https://console.developers.google.com/apis/api/iamcredentials.googleapis.com/overview?project=elite-name-482012-d1

### Étape 3 : Donner la permission d'impersonation

**Si vous avez les permissions :**

```bash
# Pour ce projet, remplacez par votre email (ex: hello@joya-energy.com)
gcloud iam service-accounts add-iam-policy-binding \
  joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com \
  --member="user:hello@joya-energy.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project=elite-name-482012-d1
```

**Si vous devez demander à un admin :**

Demandez à l'admin de :

1. Utiliser le service account existant ou créer un nouveau service account
2. Lui donner ces rôles **sur le projet** :
   - `roles/storage.objectAdmin` ⚠️ **ESSENTIEL pour uploader**
   - `roles/storage.objectViewer` (pour lire)
   - `roles/iam.serviceAccountTokenCreator` (pour signed URLs)
3. Vous donner le rôle `roles/iam.serviceAccountTokenCreator` **sur le service account lui-même**
4. Vous donner l'email du service account (ex: `joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com`)

### Étape 4 : Configurer l'impersonation avec ADC

```bash
# Utiliser le service account réel de ce projet
gcloud auth application-default login \
  --impersonate-service-account=joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com
```

### Étape 5 : Configurer la variable d'environnement

Ajoutez dans `.env.development` :

```env
# Google Cloud Storage Configuration
GCS_BUCKET_NAME=joya-pdf-storage
GCS_IMPERSONATE_SERVICE_ACCOUNT=joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com
```

⚠️ **Note :** Si vous utilisez `gcloud auth application-default login --impersonate-service-account`, cette variable est optionnelle car l'impersonation est déjà configurée via gcloud. Cependant, il est recommandé de la définir pour une configuration explicite.

### Étape 6 : Vérifier la configuration

Redémarrez votre serveur et générez un PDF. Vérifiez les logs :

✅ **Succès :**

```
✅ Generated signed URL for pdfs/pv-reports/... (expires in 3600s)
```

⚠️ **Échec (utiliserait le fallback) :**

```
⚠️ Failed to generate signed URL: Cannot sign data without `client_email`. Using public URL fallback.
```

## 🔍 Comment vérifier que ça fonctionne

1. **Générer un PDF** via votre application
2. **Récupérer l'URL** via `/api/files/{id}`
3. **Vérifier l'URL** : elle devrait contenir des paramètres de signature (`?X-Goog-Algorithm=...`)
4. **Tester l'accès** : l'URL devrait fonctionner et expirer après le délai configuré

## 🛠️ Dépannage

### Erreur : "Cannot sign data without `client_email`"

**Cause :** Les credentials ADC ne sont pas configurés avec un service account.

**Solution :**

```bash
# Ré-authentifier avec impersonation (utiliser le service account réel)
gcloud auth application-default login \
  --impersonate-service-account=joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com
```

### Erreur : "Permission 'storage.objects.create' denied"

**Cause :** Le service account n'a pas la permission d'uploader des fichiers.

**Solution :**

1. Vérifiez que le service account a le rôle `Storage Object Admin` (pas seulement `Storage Object Viewer`)
2. Allez dans IAM & Admin → IAM
3. Trouvez votre service account
4. Ajoutez le rôle : `Storage Object Admin` (ou `roles/storage.objectAdmin`)

### Erreur : "Permission denied" (impersonation)

**Cause :** Vous n'avez pas la permission d'impersoner le service account.

**Solution :** Demander à un admin de vous donner le rôle `roles/iam.serviceAccountTokenCreator` **sur le service account lui-même** (pas sur le projet).

### Le bucket est public mais je veux qu'il soit privé

**Configuration :**

1. Ne pas configurer l'IAM public sur le bucket
2. Garder le bucket privé
3. Utiliser uniquement les signed URLs pour l'accès

## 📝 Configuration actuelle du projet

**Projet GCP :** `elite-name-482012-d1` (nom d'affichage: "Joya-energy")

**Service Account utilisé :** `joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com`

**Bucket GCS :** `joya-pdf-storage`

**Rôles IAM du service account :**

- `Storage Object Admin` : Upload/écriture des fichiers
- `Storage Object Viewer` : Lecture des fichiers
- `Service Account Token Creator` : Génération de signed URLs

**Structure des fichiers dans GCS :**

- `pdfs/pv-reports/` : Rapports photovoltaïques
- `pdfs/audit-reports/` : Rapports d'audit énergétique

## 📚 Références

- [Google Cloud Storage Signed URLs](https://cloud.google.com/storage/docs/access-control/signing-urls-with-helpers)
- [Service Account Impersonation](https://cloud.google.com/iam/docs/impersonating-service-accounts)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
