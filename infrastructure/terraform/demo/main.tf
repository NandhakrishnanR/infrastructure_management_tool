locals {
  # Deterministic hostname generation based on environment and VM name
  sanitized_name = lower(replace(replace(var.vm_name, " ", "-"), "_", "-"))
  env_code       = lower(substr(var.environment, 0, 3))
  hostname       = "demo-${local.env_code}-${local.sanitized_name}.internal.infrapilot.local"
  ip_address     = "10.240.${(abs(crc32(var.request_id)) % 250) + 1}.${(abs(crc32(var.vm_name)) % 250) + 1}"
  mac_address    = "02:42:0a:f0:${format("%02x", abs(crc32(var.request_id)) % 256)}:${format("%02x", abs(crc32(var.vm_name)) % 256)}"

  manifest_data = {
    provisioner_metadata = {
      system     = "InfraPilot Engine"
      engine     = "Terraform Demo Local Provider"
      version    = "1.0.0"
      simulated  = true
      timestamp  = timestamp()
    }
    request_id       = var.request_id
    vm_name          = var.vm_name
    hostname         = local.hostname
    ip_address       = local.ip_address
    mac_address      = local.mac_address
    operating_system = var.operating_system
    cpu_cores        = var.cpu_cores
    ram_mb           = var.ram_mb
    disk_gb          = var.disk_gb
    region           = var.region
    environment      = var.environment
    owner_email      = var.owner_email
    status           = "PROVISIONED_ACTIVE"
  }
}

resource "local_file" "vm_manifest" {
  filename        = "${path.module}/manifests/vm-${var.request_id}.json"
  content         = jsonencode(local.manifest_data)
  file_permission = "0644"
}
