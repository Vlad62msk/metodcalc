import { get, set, del, keys } from 'idb-keyval'
import type { Snapshot } from '@/types/project'

const PREFIX = 'metod-calc-snapshot-'

export async function saveSnapshotToIDB(projectId: string, snapshot: Snapshot): Promise<void> {
  const key = `${PREFIX}${projectId}-${snapshot.id}`
  await set(key, snapshot)
}

export async function getSnapshotsFromIDB(projectId: string): Promise<Snapshot[]> {
  const allKeys = await keys()
  const prefix = `${PREFIX}${projectId}-`
  const snapshotKeys = allKeys.filter((k) => String(k).startsWith(prefix))

  const snapshots: Snapshot[] = []
  for (const key of snapshotKeys) {
    const snapshot = await get<Snapshot>(key)
    if (snapshot) snapshots.push(snapshot)
  }

  return snapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

export async function removeSnapshotFromIDB(projectId: string, snapshotId: string): Promise<void> {
  const key = `${PREFIX}${projectId}-${snapshotId}`
  await del(key)
}

export async function clearProjectSnapshots(projectId: string): Promise<void> {
  const allKeys = await keys()
  const prefix = `${PREFIX}${projectId}-`
  const snapshotKeys = allKeys.filter((k) => String(k).startsWith(prefix))
  for (const key of snapshotKeys) {
    await del(key)
  }
}
