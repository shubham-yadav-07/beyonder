export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'none'
export type ThreatStatus = 'active' | 'quarantined' | 'resolved'

export interface Threat {
  id: string
  name: string
  type: string
  level: ThreatLevel
  score: number
  path: string
  hash: string
  details: string
  status: ThreatStatus
  detected_at: string
  quarantined_at?: string
  resolved_at?: string
  indicators?: string[]
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  last_login?: string
  created_at: string
}

export interface Backup {
  id: string
  name: string
  type: 'full' | 'incremental' | 'selective' | 'snapshot'
  status: 'running' | 'complete' | 'failed'
  size_bytes?: number
  file_count?: number
  checksum?: string
  parent_backup_id?: string
  delta_pct?: number
  encrypted: boolean
  blockchain_hash?: string
  created_at: string
  completed_at?: string
  paths: string[]
}

export interface RecoveryLog {
  id: string
  backup_id: string
  status: 'validating' | 'restoring' | 'complete' | 'failed'
  files_restored: number
  started_at: string
  completed_at?: string
  checksum_verified: boolean
  error?: string
}

export interface Folder {
  id: string
  path: string
  label: string
  status: 'protected' | 'warning' | 'scanning'
  file_count: number
  threat_count: number
  last_scan?: string
  user_id: string
  created_at: string
  live_watch?: boolean
}

export interface FileEvent {
  id: string
  folder_id: string
  event_type: 'created' | 'modified' | 'deleted' | 'renamed'
  path: string
  dest_path?: string
  timestamp: string
}

export interface BlockchainLog {
  block_number: number
  hash: string
  previous_hash: string
  event: string
  severity: 'CRITICAL' | 'HIGH' | 'INFO' | 'LOW'
  payload: Record<string, unknown>
  timestamp: string
  verified: boolean
}

export interface Notification {
  id: string
  type: 'threat' | 'backup' | 'system' | 'ai'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  message: string
  read: boolean
  created_at: string
}

export interface ThreatScore {
  score: number
  level: string
  total_threats: number
  active_threats: number
  critical_threats: number
  scanned_files: number
}
