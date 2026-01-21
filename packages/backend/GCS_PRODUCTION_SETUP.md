# GCS Production Setup Guide

## 🚀 Production Authentication (No Manual Commands Needed!)

In production on Google Cloud Platform, authentication is **automatic** - you don't need to run any `gcloud` commands!

## ✅ For GCP Deployments (Cloud Run, GKE, Compute Engine, App Engine)

### Option 1: Attach Service Account to Compute Resource (Recommended)

**This is the easiest and most secure method for production.**

1. **Attach the service account to your compute resource:**
   - **Cloud Run**: Set `GOOGLE_IMPERSONATE_SERVICE_ACCOUNT` environment variable OR attach service account in Cloud Run settings
   - **GKE**: Use Workload Identity or attach service account to the pod/node
   - **Compute Engine**: Attach service account when creating the VM
   - **App Engine**: Set service account in `app.yaml`

2. **The code will automatically:**
   - Detect it's running on GCP
   - Use the metadata server for authentication
   - Work without any manual commands!

### Option 2: Use Service Account Impersonation (Current Setup)

If you need to use impersonation in production:

1. **Ensure the compute resource has the `Service Account Token Creator` role:**
   ```bash
   gcloud iam service-accounts add-iam-policy-binding \
     joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com \
     --member="serviceAccount:YOUR_COMPUTE_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountTokenCreator"
   ```

2. **Set the environment variable in your deployment:**
   ```env
   GOOGLE_IMPERSONATE_SERVICE_ACCOUNT=joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com
   ```

3. **The metadata server will handle authentication automatically!**

## 🔧 Configuration

### Environment Variables

Set these in your production environment (Cloud Run, GKE, etc.):

```env
GCS_BUCKET_NAME=joya-pdf-storage
GCS_IMPERSONATE_SERVICE_ACCOUNT=joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com
```

### Cloud Run Example

```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: joya-backend
spec:
  template:
    spec:
      serviceAccountName: joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com
      containers:
      - image: gcr.io/PROJECT_ID/joya-backend
        env:
        - name: GCS_BUCKET_NAME
          value: joya-pdf-storage
        - name: GCS_IMPERSONATE_SERVICE_ACCOUNT
          value: joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com
```

### GKE Example

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: joya-backend
spec:
  template:
    spec:
      serviceAccountName: joya-backend-sa
      containers:
      - name: backend
        image: gcr.io/PROJECT_ID/joya-backend
        env:
        - name: GCS_BUCKET_NAME
          value: joya-pdf-storage
        - name: GCS_IMPERSONATE_SERVICE_ACCOUNT
          value: joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com
```

## 🏠 Local Development

For local development, you still need to run:

```bash
gcloud auth application-default login --impersonate-service-account=joya-backend-803@elite-name-482012-d1.iam.gserviceaccount.com
```

This is only needed for local development. **Production on GCP works automatically!**

## ✅ Verification

After deployment, check the logs. You should see:

```
🌐 Detected GCP environment - using metadata server for automatic authentication
💡 In production on GCP, authentication is automatic - no gcloud commands needed!
✅ File uploaded to GCS: ...
```

If you see errors, check:
1. Service account is attached to the compute resource
2. Service account has `Storage Object Admin` role
3. If using impersonation, the compute service account has `Service Account Token Creator` role

## 🔒 Security Best Practices

1. **Never commit service account keys** - use metadata server instead
2. **Use least privilege** - only grant necessary IAM roles
3. **Use Workload Identity** for GKE (more secure than service account keys)
4. **Rotate service accounts** periodically

## 📝 Summary

- ✅ **Production on GCP**: Automatic authentication via metadata server
- ✅ **No manual commands needed** in production
- ✅ **Local development**: Requires `gcloud auth` command (one-time setup)
- ✅ **Works with**: Cloud Run, GKE, Compute Engine, App Engine
