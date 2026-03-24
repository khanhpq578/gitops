# Helm Cheatsheet

> **Helm** là package manager cho Kubernetes — giúp cài đặt, quản lý, và nâng cấp ứng dụng dưới dạng **Charts**.

---

## Khái niệm cơ bản

| Khái niệm | Mô tả |
|-----------|--------|
| **Chart** | Package chứa toàn bộ Kubernetes manifests của một ứng dụng |
| **Release** | Một instance của chart đã được cài lên cluster |
| **Repository** | Nơi lưu trữ và chia sẻ charts |
| **Values** | Cấu hình tùy chỉnh khi cài chart |

---

## Repositories

```bash
# Thêm repository
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# Liệt kê repositories
helm repo list

# Cập nhật danh sách charts từ repo
helm repo update

# Xóa repository
helm repo remove bitnami
```

---

## Tìm kiếm Charts

```bash
# Tìm chart trên Artifact Hub (hub.helm.sh)
helm search hub nginx

# Tìm chart trong repo đã thêm
helm search repo nginx
helm search repo bitnami/

# Tìm với version cụ thể
helm search repo nginx --versions
```

---

## Cài đặt (Install)

```bash
# Cú pháp cơ bản
helm install <release-name> <chart>

# Cài nginx-ingress
helm install my-ingress ingress-nginx/ingress-nginx

# Cài vào namespace cụ thể (tạo namespace nếu chưa có)
helm install my-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Cài với version cụ thể
helm install my-app bitnami/nginx --version 15.0.0

# Cài với custom values (inline)
helm install my-db bitnami/postgresql \
  --set auth.username=myuser \
  --set auth.password=mypassword \
  --set auth.database=mydb

# Cài với file values
helm install my-db bitnami/postgresql -f values.yaml

# Cài và đợi cho đến khi sẵn sàng
helm install my-app bitnami/nginx --wait --timeout 5m

# Dry-run (xem output mà không cài)
helm install my-app bitnami/nginx --dry-run
```

**Ví dụ thực tế — cài PostgreSQL:**
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm install postgres bitnami/postgresql \
  --namespace database \
  --create-namespace \
  --set auth.username=appuser \
  --set auth.password=strongpassword \
  --set auth.database=appdb \
  --set primary.persistence.size=20Gi \
  --wait
```

---

## Nâng cấp (Upgrade)

```bash
# Upgrade release
helm upgrade my-app bitnami/nginx

# Upgrade với values mới
helm upgrade my-app bitnami/nginx -f values-prod.yaml

# Upgrade, nếu chưa có thì install (install-or-upgrade)
helm upgrade --install my-app bitnami/nginx \
  --namespace production \
  --create-namespace \
  -f values.yaml

# Upgrade và đợi
helm upgrade my-app bitnami/nginx --wait --timeout 10m

# Reset về values mặc định (bỏ custom values cũ)
helm upgrade my-app bitnami/nginx --reset-values

# Giữ nguyên values cũ khi upgrade
helm upgrade my-app bitnami/nginx --reuse-values
```

**Ví dụ thực tế — upgrade với zero downtime:**
```bash
helm upgrade --install web bitnami/nginx \
  --set replicaCount=3 \
  --set image.tag=1.25 \
  --wait \
  --atomic   # tự rollback nếu upgrade thất bại
```

---

## Rollback

```bash
# Xem lịch sử release
helm history my-app

# Rollback về revision trước
helm rollback my-app

# Rollback về revision cụ thể
helm rollback my-app 2

# Rollback và đợi
helm rollback my-app 2 --wait
```

**Ví dụ output `helm history`:**
```
REVISION  UPDATED                   STATUS      CHART          DESCRIPTION
1         Mon Jan  6 10:00:00 2025  superseded  nginx-15.0.0   Install complete
2         Mon Jan  6 11:00:00 2025  deployed    nginx-15.1.0   Upgrade complete
```

---

## Gỡ cài đặt (Uninstall)

```bash
# Gỡ release
helm uninstall my-app

# Gỡ trong namespace cụ thể
helm uninstall my-app -n production

# Gỡ nhưng giữ lại history
helm uninstall my-app --keep-history
```

---

## Xem thông tin Release

```bash
# Liệt kê tất cả releases
helm list
helm list -A          # tất cả namespaces
helm list -n staging  # trong namespace cụ thể
helm list --failed    # chỉ release bị lỗi

# Xem trạng thái release
helm status my-app

# Xem values đang dùng
helm get values my-app
helm get values my-app --all   # bao gồm cả default values

# Xem manifest đã render
helm get manifest my-app

# Xem toàn bộ thông tin
helm get all my-app
```

---

## Values File

**Ví dụ `values.yaml` cho ứng dụng web:**
```yaml
# values.yaml
replicaCount: 3

image:
  repository: my-registry/my-app
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

env:
  - name: ENV
    value: production
  - name: LOG_LEVEL
    value: info
```

**Merge nhiều values file (sau ghi đè trước):**
```bash
helm install my-app ./my-chart \
  -f values.yaml \
  -f values-production.yaml \
  --set image.tag=2.0.0
```

---

## Tạo Chart của riêng bạn

```bash
# Tạo chart mới
helm create my-chart

# Cấu trúc thư mục được tạo ra:
# my-chart/
# ├── Chart.yaml          # metadata của chart
# ├── values.yaml         # default values
# ├── charts/             # chart dependencies
# └── templates/          # Kubernetes manifests templates
#     ├── deployment.yaml
#     ├── service.yaml
#     ├── ingress.yaml
#     ├── hpa.yaml
#     ├── _helpers.tpl    # template helpers
#     └── NOTES.txt       # hướng dẫn sau cài đặt
```

**Ví dụ `Chart.yaml`:**
```yaml
apiVersion: v2
name: my-app
description: A Helm chart for My Application
type: application
version: 1.0.0         # phiên bản chart
appVersion: "2.0.0"    # phiên bản ứng dụng
```

**Ví dụ template `templates/deployment.yaml`:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.service.port }}
          {{- with .Values.resources }}
          resources:
            {{- toYaml . | nindent 12 }}
          {{- end }}
```

---

## Lint & Test

```bash
# Kiểm tra chart có hợp lệ không
helm lint ./my-chart

# Render templates ra màn hình (không cài)
helm template my-release ./my-chart
helm template my-release ./my-chart -f values.yaml

# Test sau khi cài (chạy test pods)
helm test my-app
```

---

## Dependencies (Sub-charts)

```bash
# Khai báo trong Chart.yaml:
# dependencies:
#   - name: postgresql
#     version: "12.x.x"
#     repository: https://charts.bitnami.com/bitnami
#   - name: redis
#     version: "17.x.x"
#     repository: https://charts.bitnami.com/bitnami

# Tải dependencies
helm dependency update ./my-chart

# Liệt kê dependencies
helm dependency list ./my-chart
```

---

## Đóng gói & Chia sẻ Chart

```bash
# Đóng gói chart thành .tgz
helm package ./my-chart

# Đóng gói với version cụ thể
helm package ./my-chart --version 1.2.0

# Tạo index cho repository
helm repo index ./charts-dir --url https://mycharts.example.com

# Cài từ file .tgz local
helm install my-app ./my-chart-1.0.0.tgz

# Cài từ thư mục local
helm install my-app ./my-chart
```

---

## Secrets & Bảo mật

```bash
# Cài với secret từ biến môi trường
helm install my-db bitnami/postgresql \
  --set auth.password=$DB_PASSWORD

# Dùng với Helm Secrets plugin (mã hóa values)
# helm secrets install my-app ./chart -f secrets.yaml.enc
```

---

## CI/CD Workflow phổ biến

```bash
#!/bin/bash
# deploy.sh — Script deploy chuẩn cho CI/CD

set -e

RELEASE_NAME="my-app"
NAMESPACE="production"
CHART_PATH="./helm/my-app"
IMAGE_TAG="${CI_COMMIT_SHA:0:8}"

echo "Deploying $RELEASE_NAME version $IMAGE_TAG..."

helm upgrade --install "$RELEASE_NAME" "$CHART_PATH" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --set image.tag="$IMAGE_TAG" \
  --set env.DEPLOY_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -f "values-${ENVIRONMENT}.yaml" \
  --wait \
  --timeout 10m \
  --atomic \           # rollback tự động nếu thất bại
  --cleanup-on-fail    # dọn dẹp nếu install mới bị lỗi

echo "Deploy thành công!"
helm status "$RELEASE_NAME" -n "$NAMESPACE"
```

---

## Quick Reference

| Lệnh | Mô tả |
|------|--------|
| `helm repo add <name> <url>` | Thêm repository |
| `helm search repo <keyword>` | Tìm chart |
| `helm install <release> <chart>` | Cài chart |
| `helm upgrade --install <release> <chart>` | Cài hoặc upgrade |
| `helm uninstall <release>` | Gỡ release |
| `helm list` | Liệt kê releases |
| `helm status <release>` | Xem trạng thái |
| `helm history <release>` | Xem lịch sử |
| `helm rollback <release> <rev>` | Rollback |
| `helm get values <release>` | Xem values |
| `helm template <release> <chart>` | Render templates |
| `helm lint <chart>` | Kiểm tra chart |
| `helm create <name>` | Tạo chart mới |
