output "vm_id" {
  value       = var.request_id
  description = "Unique ID associated with the provisioned VM"
}

output "hostname" {
  value       = local.hostname
  description = "Assigned internal demo hostname"
}

output "ip_address" {
  value       = local.ip_address
  description = "Simulated internal network IP"
}

output "mac_address" {
  value       = local.mac_address
  description = "Simulated network MAC address"
}

output "manifest_path" {
  value       = local_file.vm_manifest.filename
  description = "Path to the generated JSON VM manifest"
}

output "power_state" {
  value       = "RUNNING"
  description = "Initial demo VM power state"
}
