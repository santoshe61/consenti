variable "release_name" {
  description = "Helm release name."
  type        = string
  default     = "consenti"
}

variable "namespace" {
  description = "Kubernetes namespace to deploy into."
  type        = string
  default     = "consenti"
}

variable "create_namespace" {
  description = "Whether Terraform should create the namespace."
  type        = bool
  default     = true
}

variable "image_repository" {
  description = "Container image repository — must be an image built from docker/Dockerfile in this repo and pushed to a registry your cluster can pull from. This module does not build or push images."
  type        = string
}

variable "image_tag" {
  description = "Container image tag."
  type        = string
  default     = "latest"
}

variable "admin_email" {
  description = "Bootstrap super-admin email."
  type        = string
  default     = "admin@example.com"
}

variable "admin_password" {
  description = "Bootstrap super-admin password. Provide via a secure source (e.g. TF_VAR_admin_password env var, a secrets manager data source) — never commit this to version control."
  type        = string
  sensitive   = true
}

variable "admin_jwt_secret" {
  description = "JWT signing secret. Provide via a secure source — never commit this to version control."
  type        = string
  sensitive   = true
}

variable "db_driver" {
  description = "Storage driver: node:sqlite, postgresql, mysql, mongodb, or json."
  type        = string
  default     = "node:sqlite"
}

variable "db_host" {
  description = "Database host (postgresql/mysql only)."
  type        = string
  default     = ""
}

variable "db_uri" {
  description = "Database connection URI (mongodb only)."
  type        = string
  default     = ""
}

variable "db_user" {
  description = "Database user (postgresql/mysql only). Stored in the generated Kubernetes secret, not passed as a Helm value."
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_password" {
  description = "Database password (postgresql/mysql only). Stored in the generated Kubernetes secret, not passed as a Helm value."
  type        = string
  default     = ""
  sensitive   = true
}

variable "ingress_enabled" {
  description = "Whether to create an Ingress resource."
  type        = bool
  default     = false
}

variable "ingress_host" {
  description = "Hostname for the Ingress resource, when enabled."
  type        = string
  default     = ""
}

variable "replica_count" {
  description = "Pod replica count. Only meaningful when db_driver is a real shared database (postgresql/mysql/mongodb) — node:sqlite/json use a single-writer PVC and should stay at 1."
  type        = number
  default     = 1
}
