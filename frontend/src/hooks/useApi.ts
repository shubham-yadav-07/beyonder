import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { threatsApi, backupApi, monitorApi, blockchainApi, notificationsApi } from '@/services/api'
import toast from 'react-hot-toast'

// ── Threats ──────────────────────────────────────────────────────────────────
export function useThreats(params?: { level?: string; status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['threats', params],
    queryFn: () => threatsApi.list(params).then(r => r.data),
    staleTime: 15_000,
    placeholderData: [],
  })
}

export function useThreatScore() {
  return useQuery({
    queryKey: ['threat-score'],
    queryFn: () => threatsApi.score().then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}

export function useThreatHistory() {
  return useQuery({
    queryKey: ['threat-history'],
    queryFn: () => threatsApi.history().then(r => r.data),
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function useRunScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => threatsApi.scan().then(r => r.data),
    onSuccess: () => {
      toast.success('AI scan initiated — results will appear shortly')
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['threats'] })
        qc.invalidateQueries({ queryKey: ['threat-score'] })
      }, 3000)
    },
    onError: () => toast.error('Scan failed — check backend connection'),
  })
}

export function useQuarantineThreat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => threatsApi.quarantine(id).then(r => r.data),
    onSuccess: () => {
      toast.success('Threat quarantined successfully')
      qc.invalidateQueries({ queryKey: ['threats'] })
      qc.invalidateQueries({ queryKey: ['threat-score'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Quarantine failed'),
  })
}

export function useResolveThreat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => threatsApi.resolve(id).then(r => r.data),
    onSuccess: () => {
      toast.success('Threat marked as resolved')
      qc.invalidateQueries({ queryKey: ['threats'] })
      qc.invalidateQueries({ queryKey: ['threat-score'] })
    },
    onError: () => toast.error('Failed to resolve threat'),
  })
}

// ── Backups ───────────────────────────────────────────────────────────────────
export function useBackups() {
  return useQuery({
    queryKey: ['backups'],
    queryFn: () => backupApi.list().then(r => r.data),
    staleTime: 30_000,
    placeholderData: [],
  })
}

export function useBackupStats() {
  return useQuery({
    queryKey: ['backup-stats'],
    queryFn: () => backupApi.stats().then(r => r.data),
    staleTime: 60_000,
  })
}

export function useCreateBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; type: string; paths?: string[] }) =>
      backupApi.create(data).then(r => r.data),
    onSuccess: () => {
      toast.success('Backup started — processing in background')
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['backups'] })
        qc.invalidateQueries({ queryKey: ['backup-stats'] })
      }, 3000)
    },
    onError: () => toast.error('Backup failed — check backend'),
  })
}

export function useRestoreBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => backupApi.restore(id).then(r => r.data),
    onSuccess: () => {
      toast.success('Restore initiated — validating checksum…')
      setTimeout(() => qc.invalidateQueries({ queryKey: ['recovery-logs'] }), 1000)
      setTimeout(() => qc.invalidateQueries({ queryKey: ['recovery-logs'] }), 4000)
    },
    onError: () => toast.error('Restore failed'),
  })
}

export function useValidateBackup() {
  return useMutation({
    mutationFn: (id: string) => backupApi.validate(id).then(r => r.data),
    onSuccess: (data) => {
      if (data.valid) toast.success('Backup integrity verified ✓')
      else toast.error('Checksum mismatch — backup may be corrupted')
    },
    onError: () => toast.error('Validation failed'),
  })
}

export function useRecoveryLogs() {
  return useQuery({
    queryKey: ['recovery-logs'],
    queryFn: () => backupApi.recoveryLogs().then(r => r.data),
    staleTime: 10_000,
    placeholderData: [],
    refetchInterval: (query) => {
      const data = query.state.data as any[] | undefined
      const hasActive = data?.some(r => r.status === 'validating' || r.status === 'restoring')
      return hasActive ? 1500 : false
    },
  })
}

// ── Folders ───────────────────────────────────────────────────────────────────
export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: () => monitorApi.list().then(r => r.data),
    staleTime: 20_000,
    placeholderData: [],
  })
}

export function useAddFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ path, label }: { path: string; label?: string }) =>
      monitorApi.add(path, label).then(r => r.data),
    onSuccess: () => {
      toast.success('Folder added to monitoring')
      qc.invalidateQueries({ queryKey: ['folders'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to add folder'),
  })
}

export function useRemoveFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => monitorApi.remove(id).then(r => r.data),
    onSuccess: () => {
      toast.success('Folder removed from monitoring')
      qc.invalidateQueries({ queryKey: ['folders'] })
    },
    onError: () => toast.error('Failed to remove folder'),
  })
}

export function useFileEvents(folderId?: string) {
  return useQuery({
    queryKey: ['file-events', folderId],
    queryFn: () => monitorApi.events(folderId ? { folder_id: folderId, limit: 30 } : { limit: 30 }).then(r => r.data),
    refetchInterval: 10_000,
    staleTime: 5_000,
    placeholderData: [],
  })
}

export function useMonitorStatus() {
  return useQuery({
    queryKey: ['monitor-status'],
    queryFn: () => monitorApi.status().then(r => r.data),
    refetchInterval: 20_000,
  })
}

// ── Blockchain ────────────────────────────────────────────────────────────────
export function useBlockchainLogs(params?: { limit?: number; severity?: string }) {
  return useQuery({
    queryKey: ['blockchain-logs', params],
    queryFn: () => blockchainApi.logs(params).then(r => r.data),
    staleTime: 30_000,
    placeholderData: [],
  })
}

export function useBlockchainStats() {
  return useQuery({
    queryKey: ['blockchain-stats'],
    queryFn: () => blockchainApi.stats().then(r => r.data),
    staleTime: 60_000,
  })
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function useNotifications(unreadOnly?: boolean) {
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => notificationsApi.list(unreadOnly).then(r => r.data),
    refetchInterval: 15_000,
    staleTime: 10_000,
    placeholderData: [],
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.count().then(r => r.data.unread as number),
    refetchInterval: 15_000,
    staleTime: 10_000,
    initialData: 0,
  })
}
