# Copy to terraform.tfvars and fill in real values — or pass secrets via
# TF_VAR_admin_password / TF_VAR_admin_jwt_secret env vars instead of a file at all.

image_repository = "your-registry.example.com/consenti-api"
image_tag        = "0.2.0"

admin_email = "admin@example.com"
# admin_password   — set via TF_VAR_admin_password, do not put a real password in this file
# admin_jwt_secret — set via TF_VAR_admin_jwt_secret, do not put a real secret in this file

db_driver = "node:sqlite"

ingress_enabled = true
ingress_host    = "cmp.example.com"
