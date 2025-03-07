#! /bin/bash

# Used Domain name - myapp.utshab.com

set -e

if [ "$#" -ne 1 ]
then
  echo "Error: No domain name argument provided"
  echo "Usage: Provide a domain name as an argument"
  exit 1
fi

DOMAIN=$1

mkdir openssl && cd openssl

# Create selfsigned root CA certfifcate (rootCA.key and rootCA.crt)
openssl req -x509 \
            -sha256 -days 356 \
            -nodes \
            -newkey rsa:2048 \
            -subj "/CN=${DOMAIN}/C=SG/L=Yishun" \
            -keyout rootCA.key -out rootCA.crt 

# Create the sercer private key
openssl genrsa -out ${DOMAIN}.key 2048

# csr.conf that holds the information to generate CSR
cat > csr.conf <<EOF
[ req ]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[ dn ]
C = SG
ST = Yishun
L = Yishun
O = ${DOMAIN}
OU = ${DOMAIN} Dev
CN = ${DOMAIN}

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = ${DOMAIN}
DNS.2 = www.${DOMAIN}
IP.1 = 192.168.1.5
IP.2 = 192.168.1.6

EOF

# Generate Certificate Signing Request (CSR) Using Server Private Key
openssl req -new -key ${DOMAIN}.key -out ${DOMAIN}.csr -config csr.conf

# Create cert.conf
cat > cert.conf <<EOF

authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${DOMAIN}

EOF

# Generate SSL certificate With self signed CA
openssl x509 -req \
    -in ${DOMAIN}.csr \
    -CA rootCA.crt -CAkey rootCA.key \
    -CAcreateserial -out ${DOMAIN}.crt \
    -days 365 \
    -sha256 -extfile cert.conf
