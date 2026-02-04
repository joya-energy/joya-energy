# 🔐 Configuration des Signed URLs GCS (Option 1 : IAM sans JSON key)

Ce guide explique comment configurer des **signed URLs sécurisées** pour Google Cloud Storage **sans télécharger de clé JSON**.

## ✅ Avantages de cette méthode

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

