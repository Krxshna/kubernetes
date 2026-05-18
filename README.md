# DevOps Practice Lab

A hands-on Kubernetes learning repository covering core workloads, Helm packaging, service mesh, autoscaling, RBAC, CRDs, and a real FastAPI application — all tested on **Kind** and **Minikube** local clusters.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Cluster Setup](#cluster-setup)
- [Modules](#modules)
  - [Kubernetes Basics](#1-kubernetes-basics)
  - [Apache Workload + RBAC](#2-apache-workload--rbac)
  - [MySQL StatefulSet](#3-mysql-statefulset)
  - [Notes App (FastAPI)](#4-notes-app-fastapi)
  - [Helm Chart — Apache](#5-helm-chart--apache)
  - [Istio Service Mesh](#6-istio-service-mesh)
  - [Custom Resource Definitions](#7-custom-resource-definitions)
  - [Kubernetes Dashboard](#8-kubernetes-dashboard)

---

## Overview

A structured reference repository covering the Kubernetes ecosystem end-to-end. Each directory is a self-contained module with manifests, configurations, and commands — spanning core workloads, stateful applications, Helm packaging, RBAC, autoscaling, CRDs, and service mesh.

All workloads run locally using **Kind** (Kubernetes in Docker) or **Minikube** — no cloud account required.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Kubernetes** | Container orchestration |
| **Kind / Minikube** | Local cluster environments |
| **Helm** | Kubernetes package manager |
| **Istio 1.29.2** | Service mesh (traffic, security, observability) |
| **FastAPI** | Sample Python web application |
| **MySQL** | Stateful database workload |
| **Apache HTTPD** | Stateless web server workload |
| **NGINX Ingress** | Cluster ingress controller |
| **SQLAlchemy** | ORM for the notes app |
| **Docker** | Container runtime |

---

## Repository Structure

```
kubernetes/
├── kubernetes/          # Core K8s primitives (pod, deployment, job, namespace)
├── apache/              # Apache workload with HPA, VPA, and full RBAC
│   └── RBAC/            # ServiceAccount, Role, RoleBinding
├── mysql/               # MySQL StatefulSet with headless service and PVC
├── notes-app/           # FastAPI CRUD app + K8s manifests + ingress
│   └── k8s/
├── helm/                # Helm chart for Apache with full template set
│   └── apache-helm/
│       └── templates/
├── crd/                 # Custom Resource Definition + CR instance
├── dashboard/           # K8s Dashboard RBAC setup
├── install_kind.sh      # Automated Kind + kubectl installer
└── monitoring/          # (planned)
```

---

## Getting Started

### Prerequisites

- Docker
- Kind or Minikube
- kubectl
- Helm 3

### Quick Cluster Setup

**Kind (Kubernetes in Docker):**

```bash
# Automated setup (installs Docker, Kind, kubectl)
chmod +x install_kind.sh
./install_kind.sh

# Create a cluster
kind create cluster --name devops-lab
```

**Minikube:**

```bash
minikube start --cpus=2 --memory=4g
```

### Install Helm

```bash
chmod +x helm/get_helm.sh
./helm/get_helm.sh
```

---

## Cluster Setup

All workloads were tested on:
- **Kind v0.29.0** — multi-node local clusters
- **Minikube** — single-node local clusters

The `install_kind.sh` script handles Docker installation, Kind binary download (aarch64/x86_64 auto-detection), and kubectl setup automatically on Linux.

---

## Modules

### 1. Kubernetes Basics

**Directory:** [kubernetes/](kubernetes/)

Starting point — the fundamentals of Kubernetes objects.

| File | What it covers |
|------|---------------|
| `pod.yaml` | Standalone pod definition |
| `deployment.yml` | NGINX deployment with 2 replicas |
| `namespace.yml` | Namespace isolation |
| `job.yaml` | One-shot Job resource |

```bash
kubectl apply -f kubernetes/
kubectl get pods -n nginx-namespace
```

---

### 2. Apache Workload + RBAC

**Directory:** [apache/](apache/)

A complete Apache HTTPD workload demonstrating production-style resource management and access control.

**Highlights:**
- Deployment with CPU/memory requests and limits
- **HPA** — scales between 1–5 replicas, triggers at 5% CPU
- **VPA** — automatically right-sizes container resources (Auto mode)
- Full **RBAC** setup: ServiceAccount → Role → RoleBinding

```bash
kubectl apply -f apache/namespace.yml
kubectl apply -f apache/RBAC/
kubectl apply -f apache/deployment.yaml
kubectl apply -f apache/hpa.yml
kubectl apply -f apache/vpa.yml
```

**RBAC layout:**

```
ServiceAccount: apache-user
    └── RoleBinding
            └── Role (get/list/watch on pods, deployments, services)
```

---

### 3. MySQL StatefulSet

**Directory:** [mysql/](mysql/)

Stateful workload using a StatefulSet with persistent storage — a common real-world pattern for databases.

**Highlights:**
- 3-replica StatefulSet with 1Gi PersistentVolumeClaim per pod
- Headless Service for stable pod DNS (`mysql-0.mysql`, `mysql-1.mysql`, ...)
- ConfigMap for database configuration
- Secret for root password (base64 encoded)

```bash
kubectl apply -f mysql/namespace.yml
kubectl apply -f mysql/configmap.yml
kubectl apply -f mysql/secret.yml
kubectl apply -f mysql/service.yml
kubectl apply -f mysql/statefulset.yml
```

---

### 4. Notes App (FastAPI)

**Directory:** [notes-app/](notes-app/)

A real CRUD application to practice deploying custom workloads on Kubernetes.

**App features:**
- FastAPI backend with SQLite (SQLAlchemy ORM)
- Jinja2 templates for server-side rendered frontend
- REST API: `GET / POST / PUT / DELETE /api/notes/`
- Dockerized and pushed to `krishna5534/notes-app:latest`

**K8s manifests:**

| File | Resource |
|------|----------|
| `k8s/namespace.yml` | Dedicated namespace |
| `k8s/deployment.yml` | 1-replica deployment on port 8000 |
| `k8s/service.yml` | ClusterIP service |
| `k8s/ingress.yml` | NGINX ingress with path routing |

```bash
kubectl apply -f notes-app/k8s/
kubectl get ingress -n notes-app
```

---

### 5. Helm Chart — Apache

**Directory:** [helm/apache-helm/](helm/apache-helm/)

A fully templated Helm chart for the Apache HTTPD workload — demonstrating real chart authoring practices.

**Chart:** `apache-helm` v0.1.0 | App: httpd 2.4

**Templates included:**

| Template | Purpose |
|----------|---------|
| `deployment.yaml` | Parameterized Apache deployment |
| `service.yaml` | Service with configurable type/port |
| `ingress.yaml` | Ingress with TLS support |
| `httproute.yaml` | Gateway API HTTPRoute |
| `hpa.yaml` | HPA with CPU/memory targets |
| `serviceaccount.yaml` | Optional service account |
| `_helpers.tpl` | Shared label/name helpers |
| `tests/` | `helm test` connection test |

**Key defaults (`values.yaml`):**

```yaml
replicaCount: 3
image:
  repository: httpd
  tag: "2.4"
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 100
  targetCPUUtilizationPercentage: 80
```

**Usage:**

```bash
# Install from local chart
helm install my-apache ./helm/apache-helm

# Install from packaged chart
helm install my-apache ./helm/apache-helm-0.1.0.tgz

# Override replicas
helm install my-apache ./helm/apache-helm --set replicaCount=5

# Run tests
helm test my-apache
```

---

### 6. Istio Service Mesh

Istio 1.29.2 installed for hands-on service mesh practice.

**Covers:**
- Sidecar proxy injection (Envoy)
- Traffic management (VirtualService, DestinationRule)
- mTLS and security policies
- Observability (Kiali, Jaeger, Prometheus integration)
- Ztunnel (ambient mesh mode)

```bash
# Install Istio
cd istio/istio-1.29.2
./bin/istioctl install --set profile=demo

# Enable sidecar injection on a namespace
kubectl label namespace default istio-injection=enabled
```

---

### 7. Custom Resource Definitions

**Directory:** [crd/](crd/)

Demonstrates extending the Kubernetes API with a custom resource.

**CRD:** `MlBatch` (group: `mlmodels.io`)

```yaml
# Shortnames: ai, ml, models
kind: MlBatch
spec:
  name: string
  model: string        # e.g. resnet50
  environment: string  # e.g. cloud
  platform: string     # e.g. Colab
```

```bash
kubectl apply -f crd/devops-crd.yaml
kubectl apply -f crd/devops-cr.yaml
kubectl get mlbatch        # or: kubectl get ai / kubectl get ml
kubectl describe mlbatch mlbatch-3
```

---

### 8. Kubernetes Dashboard

**Directory:** [dashboard/](dashboard/)

Admin-level access setup for the Kubernetes Dashboard UI.

```bash
kubectl apply -f dashboard/dashboard-admin-user.yaml

# Get the login token
kubectl -n kubernetes-dashboard create token admin-user

# Start the proxy
kubectl proxy
# Open: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

---

> Built for learning.
