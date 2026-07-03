# Kubernetes Manifests

Manifests para deploy do SRM Credit Engine em cluster Kubernetes.

## Estrutura

```
k8s/
├── namespace.yaml
├── postgres/statefulset.yaml
├── backend/deployment.yaml
├── frontend/deployment.yaml
└── monitoring/prometheus.yaml
```

## Deploy

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/monitoring/
```

## Pré-requisitos

- Imagens Docker `srm-credit-engine/backend:1.0.0` e `srm-credit-engine/web:1.0.0` publicadas no registry
- Secret `srm-secrets` com `postgres-password`

## Verificação

```bash
kubectl get pods -n srm-credit-engine
kubectl port-forward svc/backend 4000:4000 -n srm-credit-engine
kubectl port-forward svc/grafana 3001:3000 -n srm-credit-engine
```

## HPA

O backend escala de 2 a 10 pods com target CPU 70%.
