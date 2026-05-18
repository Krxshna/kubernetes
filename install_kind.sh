#!/bin/bash

set -euo pipefail

KIND_VERSION="v0.29.0"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { echo "[ERROR] $*" >&2; exit 1; }

detect_arch() {
  local arch
  arch=$(uname -m)
  case "$arch" in
    x86_64)  echo "amd64" ;;
    aarch64) echo "arm64" ;;
    arm64)   echo "arm64" ;;
    *)       die "Unsupported architecture: $arch" ;;
  esac
}

install_docker() {
  if command -v docker &>/dev/null; then
    log "Docker already installed, skipping."
    return
  fi
  log "Installing Docker..."
  sudo apt-get update -y
  sudo apt-get install -y docker.io
  sudo usermod -aG docker "$USER"
  log "Docker installed. Re-login required for group changes to take effect."
}

install_kind() {
  if command -v kind &>/dev/null; then
    log "Kind already installed, skipping."
    return
  fi
  local arch
  arch=$(detect_arch)
  log "Installing Kind ${KIND_VERSION} (${arch})..."
  curl -fsSL -o /tmp/kind "https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-linux-${arch}"
  chmod +x /tmp/kind
  sudo mv /tmp/kind /usr/local/bin/kind
  log "Kind installed."
}

install_kubectl() {
  if command -v kubectl &>/dev/null; then
    log "kubectl already installed, skipping."
    return
  fi
  local arch version
  arch=$(detect_arch)
  version=$(curl -fsSL https://dl.k8s.io/release/stable.txt)
  log "Installing kubectl ${version} (${arch})..."
  curl -fsSL -o /tmp/kubectl "https://dl.k8s.io/release/${version}/bin/linux/${arch}/kubectl"
  chmod +x /tmp/kubectl
  sudo mv /tmp/kubectl /usr/local/bin/kubectl
  log "kubectl installed."
}

print_versions() {
  log "Installed versions:"
  docker --version
  kind --version
  kubectl version --client --output=yaml
}

main() {
  install_docker
  install_kind
  install_kubectl
  print_versions
}

main "$@"
