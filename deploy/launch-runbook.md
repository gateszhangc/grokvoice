# Grok Voice Release Runbook

GitHub repository: `gateszhangc/grokvoice`  
Git branch: `main`  
Dokploy project: `n/a`  
Image repository: `registry.144.91.77.245.sslip.io/grokvoice`  
K8s manifest path: `deploy/k8s/overlays/prod`  
Argo CD application: `grokvoice`  
Primary domain: `grokvoice.homes`  

Release route:

`gateszhangc/grokvoice -> main -> K8s build Job -> registry.144.91.77.245.sslip.io/grokvoice -> deploy/k8s/overlays/prod newTag -> Argo CD grokvoice`

## What Lives In This Repo

- `Dockerfile`: production image for the static Grok Voice site
- `.github/workflows/build-and-release.yml`: browser test -> K8s build job -> `newTag` sync -> Argo rollout verification
- `.github/manifests/k8s-image-build-job.yaml`: Kaniko Job template rendered by GitHub Actions
- `deploy/k8s/base`: namespace, deployment, service
- `deploy/k8s/overlays/prod`: issuer, certificate, ingress, and release tag source of truth
- `deploy/argocd`: one-time `kubectl apply` manifests for the Argo `AppProject` and `Application`
- `scripts/update_kustomization_newtag.py`: deterministic `newTag` updater
- `scripts/verify-live-site.sh`: HTTPS and asset health checks after rollout

## Required GitHub Repository Secrets

- `KUBE_CONFIG`: kubeconfig content with access to `argocd`, `build-jobs`, and `grokvoice`

## Required Cluster Prerequisites

- Namespace `build-jobs` already exists
- Secret `build-jobs/registry-push` contains Docker config for pushes to `registry.144.91.77.245.sslip.io`
- Namespace `grokvoice` contains secret `cloudflare-global-api-key`
- Argo CD has CRDs installed in namespace `argocd`

## One-Time Bootstrap

```bash
kubectl apply -f deploy/k8s/base/namespace.yaml
kubectl -n grokvoice create secret generic cloudflare-global-api-key \
  --from-literal=api-key="$CLOUDFLARE_GLOBAL_API_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f deploy/argocd/10-grokvoice-appproject.yaml
kubectl apply -f deploy/argocd/20-grokvoice-application.yaml
```

## DNS And GSC

- DNS authority target: Cloudflare
- Apex domain: `grokvoice.homes`
- WWW redirect target: `https://grokvoice.homes/`
- GSC property type: `Domain`
- Required property: `sc-domain:grokvoice.homes`
- Required sitemap URL: `https://grokvoice.homes/sitemap.xml`
- GA4: skipped
- Clarity: skipped

## Verification

Local:

```bash
npm test
docker build -t grokvoice .
docker run --rm -p 3000:3000 grokvoice
curl http://127.0.0.1:3000/healthz
```

Production:

```bash
curl -I https://grokvoice.homes/
curl -I https://grokvoice.homes/robots.txt
curl -I https://grokvoice.homes/sitemap.xml
kubectl -n argocd get application grokvoice
kubectl -n grokvoice rollout status deployment/grokvoice
```

GSC:

```bash
export PRIMARY_URL="https://grokvoice.homes"
export GSC_PROPERTY_TYPE="domain"
export GSC_SITE_URL="sc-domain:grokvoice.homes"
export GSC_SITEMAP_URL="https://grokvoice.homes/sitemap.xml"
export SKIP_GA4=true
export SKIP_CLARITY=true
bash "$HOME/.codex/skills/webapp-launch-analytics/scripts/setup-gsc.sh" "$PRIMARY_URL"
bash "$HOME/.codex/skills/webapp-launch-analytics/scripts/check-gsc-property.sh" "$PRIMARY_URL"
```

## Rollback

1. Revert `deploy/k8s/overlays/prod/kustomization.yaml` to the previous `newTag`.
2. Push the revert to `main`.
3. Wait for Argo CD to auto-sync the previous image tag.
4. Re-run the production verification commands.
