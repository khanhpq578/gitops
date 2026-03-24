# kubectl Cheatsheet

> **kubectl** là công cụ CLI để tương tác với Kubernetes cluster.

---

## Cấu hình & Context

```bash
# Xem cấu hình hiện tại
kubectl config view

# Xem context đang dùng
kubectl config current-context

# Liệt kê tất cả context
kubectl config get-contexts

# Chuyển context
kubectl config use-context my-cluster

# Set namespace mặc định
kubectl config set-context --current --namespace=production
```

---

## Nodes

```bash
# Liệt kê nodes
kubectl get nodes

# Xem chi tiết node
kubectl describe node node-name

# Xem tài nguyên node (CPU/RAM)
kubectl top nodes
```

---

## Pods

```bash
# Liệt kê pods (namespace hiện tại)
kubectl get pods

# Liệt kê pods tất cả namespaces
kubectl get pods -A

# Liệt kê pods với thông tin thêm (IP, Node)
kubectl get pods -o wide

# Xem chi tiết pod
kubectl describe pod my-pod

# Xem logs pod
kubectl logs my-pod

# Xem logs container cụ thể (pod có nhiều container)
kubectl logs my-pod -c my-container

# Stream logs theo thời gian thực
kubectl logs -f my-pod

# Xóa pod
kubectl delete pod my-pod

# Chạy lệnh trong pod
kubectl exec -it my-pod -- /bin/bash

# Copy file vào/ra pod
kubectl cp my-pod:/app/log.txt ./log.txt
kubectl cp ./config.yaml my-pod:/app/config.yaml
```

**Ví dụ thực tế — tạo pod nhanh để test:**
```bash
kubectl run nginx-test --image=nginx:alpine --port=80
kubectl exec -it nginx-test -- curl localhost
kubectl delete pod nginx-test
```

---

## Deployments

```bash
# Liệt kê deployments
kubectl get deployments

# Tạo deployment
kubectl create deployment my-app --image=my-image:1.0

# Scale deployment
kubectl scale deployment my-app --replicas=3

# Cập nhật image
kubectl set image deployment/my-app my-container=my-image:2.0

# Xem trạng thái rollout
kubectl rollout status deployment/my-app

# Xem lịch sử rollout
kubectl rollout history deployment/my-app

# Rollback về phiên bản trước
kubectl rollout undo deployment/my-app

# Rollback về revision cụ thể
kubectl rollout undo deployment/my-app --to-revision=2

# Xóa deployment
kubectl delete deployment my-app
```

**Ví dụ thực tế — deploy và rollback:**
```bash
# Deploy v1
kubectl create deployment web --image=nginx:1.24
kubectl scale deployment web --replicas=3

# Cập nhật lên v2
kubectl set image deployment/web nginx=nginx:1.25
kubectl rollout status deployment/web

# Rollback nếu có lỗi
kubectl rollout undo deployment/web
```

---

## Services

```bash
# Liệt kê services
kubectl get services

# Expose deployment qua ClusterIP
kubectl expose deployment my-app --port=80 --target-port=8080

# Expose qua NodePort
kubectl expose deployment my-app --type=NodePort --port=80

# Expose qua LoadBalancer
kubectl expose deployment my-app --type=LoadBalancer --port=80

# Port-forward để test local
kubectl port-forward service/my-app 8080:80
kubectl port-forward pod/my-pod 9090:9090
```

**Ví dụ thực tế — truy cập service locally:**
```bash
kubectl expose deployment web --port=80
kubectl port-forward service/web 8080:80
# Mở browser: http://localhost:8080
```

---

## ConfigMaps & Secrets

```bash
# Tạo ConfigMap từ literal
kubectl create configmap app-config \
  --from-literal=ENV=production \
  --from-literal=LOG_LEVEL=info

# Tạo ConfigMap từ file
kubectl create configmap app-config --from-file=config.properties

# Xem ConfigMap
kubectl get configmap app-config -o yaml

# Tạo Secret
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=s3cr3t

# Xem Secret (base64 encoded)
kubectl get secret db-secret -o yaml

# Decode secret
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 --decode
```

---

## Namespaces

```bash
# Liệt kê namespaces
kubectl get namespaces

# Tạo namespace
kubectl create namespace staging

# Chạy lệnh trong namespace cụ thể
kubectl get pods -n staging

# Xóa namespace (xóa toàn bộ resource bên trong)
kubectl delete namespace staging
```

---

## Apply / Delete từ file YAML

```bash
# Áp dụng manifest
kubectl apply -f deployment.yaml
kubectl apply -f ./manifests/           # áp dụng cả thư mục
kubectl apply -f https://example.com/manifest.yaml

# Xóa resource từ file
kubectl delete -f deployment.yaml

# Xem diff trước khi apply
kubectl diff -f deployment.yaml
```

**Ví dụ file `deployment.yaml`:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: my-image:1.0
          ports:
            - containerPort: 8080
          env:
            - name: ENV
              value: "production"
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
```

---

## Labels & Selectors

```bash
# Lọc resource theo label
kubectl get pods -l app=my-app
kubectl get pods -l env=production,tier=frontend

# Thêm label
kubectl label pod my-pod version=v2

# Xóa label
kubectl label pod my-pod version-
```

---

## Resource Usage

```bash
# Xem CPU/RAM của pods
kubectl top pods

# Xem CPU/RAM của pods trong namespace
kubectl top pods -n production

# Xem resource requests/limits
kubectl get pods -o custom-columns=\
'NAME:.metadata.name,CPU_REQ:.spec.containers[*].resources.requests.cpu,MEM_REQ:.spec.containers[*].resources.requests.memory'
```

---

## Troubleshooting

```bash
# Xem events của cluster
kubectl get events --sort-by='.lastTimestamp'

# Xem events của namespace cụ thể
kubectl get events -n production --sort-by='.lastTimestamp'

# Debug pod đang Pending/CrashLoopBackOff
kubectl describe pod my-pod      # xem Events ở cuối output
kubectl logs my-pod --previous   # xem logs lần chạy trước

# Kiểm tra endpoints của service
kubectl get endpoints my-service

# Chạy pod debug tạm thời
kubectl run debug --image=busybox --rm -it --restart=Never -- sh
```

---

## Output Formats

```bash
# YAML output
kubectl get pod my-pod -o yaml

# JSON output
kubectl get pod my-pod -o json

# Custom columns
kubectl get pods -o custom-columns='NAME:.metadata.name,STATUS:.status.phase'

# JSONPath
kubectl get pod my-pod -o jsonpath='{.status.podIP}'

# Lọc nhiều field
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'
```

---

## Các lệnh hay dùng kết hợp

```bash
# Xóa tất cả pods đang lỗi (Error/CrashLoopBackOff)
kubectl get pods | grep -E 'Error|CrashLoop' | awk '{print $1}' | xargs kubectl delete pod

# Restart deployment (không downtime)
kubectl rollout restart deployment/my-app

# Xem tất cả resource trong namespace
kubectl get all -n production

# Force xóa pod bị stuck Terminating
kubectl delete pod my-pod --grace-period=0 --force
```

---

## Quick Reference

| Lệnh | Mô tả |
|------|--------|
| `kubectl get <resource>` | Liệt kê resource |
| `kubectl describe <resource> <name>` | Chi tiết resource |
| `kubectl apply -f <file>` | Tạo/cập nhật từ file |
| `kubectl delete <resource> <name>` | Xóa resource |
| `kubectl logs <pod>` | Xem logs |
| `kubectl exec -it <pod> -- bash` | Shell vào pod |
| `kubectl port-forward <pod> <local>:<remote>` | Forward port |
| `kubectl rollout restart deployment/<name>` | Restart deployment |
