# Description
Here in this POC I install TLS/SSL certificate in **kubernetes ingress**. The POC is done in a *GCP GKE* cluster hence
- Service type used `NodePort`
- Ingress class used `gce`

## Steps
### Used Domain name in the POC
`myapp.utshab.com`
#### Command used to generate self-signed certificate
```bash
./generate-ssl.sh myapp.utshab.com
```

### Create a dev namespace.
```bash
kubectl create ns dev
```

### Deploy application
```bash
kubectl apply -f hello-app.yaml 
```

### Create a Kubernetes TLS Secret
Run the below command from the directory where `<server>.crt` is present. In my case `openssl` since I have used `generate-ssl.sh` script to create the `self-signed` certficate and it creates the `openssl` folder.
- If want to redo the TLS/SSL cert generation, just remove `openssl` folder and execute `generate-ssl.sh`
```bash
kubectl create secret tls hello-app-tls \
    --namespace dev \
    --key <server>.key \
    --cert <server>.crt
```

## Reference
- [How To Configure Ingress TLS/SSL Certificates in Kubernetes](https://devopscube.com/configure-ingress-tls-kubernetes/)
- [How to Create Self-Signed Certificates using OpenSSL](https://devopscube.com/create-self-signed-certificates-openssl/)