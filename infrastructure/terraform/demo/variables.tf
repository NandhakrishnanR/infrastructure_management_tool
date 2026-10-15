variable "request_id" {
  type        = string
  description = "Unique ID of the infrastructure request"
}

variable "vm_name" {
  type        = string
  description = "Name of the virtual machine"
}

variable "operating_system" {
  type        = string
  description = "Operating system (e.g. Ubuntu 22.04 LTS, RHEL 9, Windows Server 2022)"
}

variable "cpu_cores" {
  type        = number
  description = "Number of vCPU cores"
}

variable "ram_mb" {
  type        = number
  description = "RAM in Megabytes"
}

variable "disk_gb" {
  type        = number
  description = "Storage disk size in Gigabytes"
}

variable "region" {
  type        = string
  description = "Deployment region (e.g. us-east-1, eu-central-1)"
}

variable "environment" {
  type        = string
  description = "Environment tier (Development, Testing, Production)"
}

variable "owner_email" {
  type        = string
  description = "Email address of the requester/owner"
}
