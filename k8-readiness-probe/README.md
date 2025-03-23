### Command
```bash
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -t utssaha/node-app:v3 --push .
```