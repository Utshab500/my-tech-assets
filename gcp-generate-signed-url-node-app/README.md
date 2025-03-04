# Description
This is a POC of generating <b>signed URL</b> for the GCP bucket objects. This app deployes a <b>k8 workload</b> in `Workload Identity Federation` enabled cluster. Which removes the need of `key.json` of an `IAM ServiceAccount` by the *Node App* to authenticate itself to access the GCP resources.

Here in this POC I skipped the binding of `K8 ServiceAccount` with `IAM ServiceAccount` as my cluster was already had the binding.