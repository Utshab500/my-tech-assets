#!/bin/bash

# Create a service account
kubectl create serviceaccount my-node-app

# Create a GCP IAM Service account
gcloud iam service-accounts create my-node-app-sa --display-name "My Node App SA"

# Assign IAM roles ass needed
gcloud projects add-iam-policy-binding <PROJECT_ID> \
    --member=serviceAccount:my-node-app-sa@<PROJECT_ID>.iam.gserviceaccount.com \
    --role=roles/storage.objectViewer

# Enable WIF in cluster
gcloud container clusters update <CLUSTER_NAME> \
    --workload-pool=<PROJECT_ID>.svc.id.goog

# Bind k8 SA to GCP IAM SA
gcloud iam service-accounts add-iam-policy-binding \
    my-node-app-sa@<PROJECT_ID>.iam.gserviceaccount.com \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:<PROJECT_ID>.svc.id.goog[default/my-node-app]"

# Modify the deployment yaml to have the deployment use the SA