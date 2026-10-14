resource "random_id" "this" {
  byte_length = 4

  keepers = {
    seed_input = try(var.aws_app_code, terraform.workspace)
  }
}

resource "random_pet" "this" {
  length    = 3
  separator = "-"

  keepers = {
    seed_input = try(var.aws_app_code, terraform.workspace)
  }
}

# Signing key for the backend's JWTs, generated once per deployment and passed to
# every Lambda as JWT_SECRET (see local.env_vars).
resource "random_password" "jwt" {
  length  = 64
  special = false

  keepers = {
    seed_input = try(var.aws_app_code, terraform.workspace)
  }
}
