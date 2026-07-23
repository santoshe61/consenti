terraform {
  required_version = ">= 1.5.0"
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
  }
}

# Expects an existing Kubernetes cluster reachable via the provider config passed in by the
# caller (kubeconfig path, context, etc.) — this module does not provision a cluster. Pick that
# up from your own root module / CI environment, the same way you would for any other
# `helm_release` deployment.

resource "kubernetes_secret" "consenti_admin" {
  metadata {
    name      = "${var.release_name}-admin"
    namespace = var.namespace
  }

  data = merge(
    {
      "admin-password"   = var.admin_password
      "admin-jwt-secret" = var.admin_jwt_secret
    },
    var.db_user != "" ? { "db-user" = var.db_user } : {},
    var.db_password != "" ? { "db-password" = var.db_password } : {},
  )

  type = "Opaque"
}

resource "helm_release" "consenti" {
  name             = var.release_name
  namespace        = var.namespace
  create_namespace = var.create_namespace
  chart            = "${path.module}/../helm/consenti"

  set {
    name  = "existingSecret"
    value = kubernetes_secret.consenti_admin.metadata[0].name
  }
  set {
    name  = "image.repository"
    value = var.image_repository
  }
  set {
    name  = "image.tag"
    value = var.image_tag
  }
  set {
    name  = "config.dbDriver"
    value = var.db_driver
  }
  set {
    name  = "config.adminEmail"
    value = var.admin_email
  }
  set {
    name  = "ingress.enabled"
    value = var.ingress_enabled
  }
  set {
    name  = "ingress.host"
    value = var.ingress_host
  }
  set {
    name  = "replicaCount"
    value = var.replica_count
  }

  dynamic "set" {
    for_each = var.db_host != "" ? [1] : []
    content {
      name  = "config.dbHost"
      value = var.db_host
    }
  }
  dynamic "set" {
    for_each = var.db_uri != "" ? [1] : []
    content {
      name  = "config.dbUri"
      value = var.db_uri
    }
  }
}
