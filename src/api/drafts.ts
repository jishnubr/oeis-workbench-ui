// Centralized API layer — all fetch() calls live here.
// If the backend URL or method changes, update only this file.

const BASE = '/api';

export async function getDrafts(): Promise<any[]> {
  const res = await fetch(`${BASE}/drafts`);
  if (!res.ok) throw new Error('Failed to fetch drafts');
  return res.json();
}

export async function saveDraft(payload: any): Promise<{ success: boolean; internal_id: string }> {
  const res = await fetch(`${BASE}/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save draft: ' + await res.text());
  return res.json();
}

export async function patchDraft(id: string, updates: Record<string, any>): Promise<void> {
  const res = await fetch(`${BASE}/drafts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to patch draft');
}

export async function deleteDraft(id: string): Promise<void> {
  const res = await fetch(`${BASE}/drafts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete draft');
}

export async function updatePriority(id: string, priority_order: number): Promise<void> {
  const res = await fetch(`${BASE}/drafts/${id}/priority`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority_order }),
  });
  if (!res.ok) throw new Error('Failed to update priority');
}

export async function batchPatch(patches: any[]): Promise<void> {
  const res = await fetch(`${BASE}/drafts/batch-patch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patches),
  });
  if (!res.ok) throw new Error('Failed to batch patch');
}

export async function exportDrafts(filter: { statuses: string[], fields: string[] }): Promise<{ success: boolean; count: number; data: any[] }> {
  const res = await fetch(`${BASE}/drafts/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter),
  });
  if (!res.ok) throw new Error('Failed to export drafts: ' + await res.text());
  return res.json();
}
