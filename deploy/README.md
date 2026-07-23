# Deployment References

> **Community reference examples — not covered by CI, tests, or support commitments.**
>
> These are one-time additions, not maintained alongside releases. They're here to give
> enterprise evaluators something concrete to point to when asking "do you have a Helm chart? a
> Terraform module?" — not a supported deployment path. If you use these in production, expect
> to adapt them yourself; PRs improving them are welcome but not proactively kept in sync with
> new Consenti versions.
>
> For an actually-maintained self-hosting path, use [`../docker/`](../docker/) and
> [`../docker-compose.yml`](../docker-compose.yml) instead — those are kept in sync with releases.

## What's here

- **[`helm/consenti/`](./helm/consenti/)** — a minimal Helm chart: Deployment, Service, Ingress
  (optional), PersistentVolumeClaim (for `node:sqlite`/`json` storage), and a `NOTES.txt`. Does
  not build container images for you — point `image.repository`/`image.tag` at an image built
  from [`../docker/Dockerfile`](../docker/Dockerfile) and pushed to a registry your cluster can
  pull from.
- **[`terraform/`](./terraform/)** — a thin Terraform module wrapping `helm_release` for the
  chart above, plus a `kubernetes_secret` resource for admin credentials. Expects an existing
  Kubernetes cluster reachable via whatever `kubernetes`/`helm` provider configuration your root
  module supplies — this module does not provision a cluster.

## Quick start — Helm

```bash
# 1. Build and push an image (see ../docker/README.md for the Dockerfile itself)
docker build --build-arg CONSENTI_API_VERSION=0.2.0 -t your-registry.example.com/consenti-api:0.2.0 ../docker
docker push your-registry.example.com/consenti-api:0.2.0

# 2. Create the admin credentials secret yourself — the chart refuses to deploy without it
kubectl create secret generic consenti-admin \
  --from-literal=admin-password="$(openssl rand -base64 24)" \
  --from-literal=admin-jwt-secret="$(openssl rand -hex 32)"

# 3. Install
helm install consenti ./helm/consenti \
  --set image.repository=your-registry.example.com/consenti-api \
  --set image.tag=0.2.0 \
  --set existingSecret=consenti-admin
```

See [`helm/consenti/values.yaml`](./helm/consenti/values.yaml) for every configurable field
(ingress, storage driver, resources, persistence size, etc.).

## Quick start — Terraform

```bash
cd terraform
cp example.tfvars terraform.tfvars   # fill in image_repository at minimum
export TF_VAR_admin_password=$(openssl rand -base64 24)
export TF_VAR_admin_jwt_secret=$(openssl rand -hex 32)
terraform init
terraform plan
terraform apply
```

The Terraform module calls the Helm chart in this same directory (`../helm/consenti`) — you
don't need to `helm install` separately when using Terraform.

## Why SQLite defaults to a single replica

Both the chart and the module default to `node:sqlite` storage, which — like any single-file
database — needs exactly one writer. The chart deliberately pins `replicas: 1` whenever
`config.dbDriver` is `node:sqlite` or `json`, regardless of what `replicaCount` is set to.
Switch `config.dbDriver` to `postgresql`, `mysql`, or `mongodb` (a real shared database) before
scaling beyond one pod.
