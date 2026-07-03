# Runbook: Deployment Guide

## Pré-requisitos

- Node.js >= 20.11.0
- Docker >= 24.0
- kubectl (para deploy K8s)

## Deploy Local

```bash
npm install
npm run docker:up
npm run db:setup -w apps/backend
npm run dev
```

URLs:

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| Swagger | http://localhost:4000/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |
| Jaeger | http://localhost:16686 |

## Deploy Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/monitoring/
```

## Release (Semantic Versioning)

```bash
git tag -a v1.0.0 -m "Release v1.0.0 - MVP Especialista"
git push origin v1.0.0
```

## Rollback

```bash
kubectl rollout undo deployment/backend -n srm-credit-engine
```

Ou via Git:

```bash
git revert <commit-sha>
```
