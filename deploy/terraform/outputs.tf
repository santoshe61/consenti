output "release_name" {
  description = "The Helm release name."
  value       = helm_release.consenti.name
}

output "namespace" {
  description = "The Kubernetes namespace Consenti was deployed into."
  value       = helm_release.consenti.namespace
}

output "admin_secret_name" {
  description = "Name of the generated Kubernetes secret holding admin credentials — read the values back via kubectl if needed, they are not exposed as Terraform outputs."
  value       = kubernetes_secret.consenti_admin.metadata[0].name
}
