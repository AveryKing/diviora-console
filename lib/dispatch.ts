import { DispatchRecord } from './types';

export async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function buildDispatchId(hash: string, createdAt: string): string {
  const compactTs = createdAt.replace(/[-:.TZ]/g, '').slice(0, 14);
  return `disp_${hash.slice(0, 10)}_${compactTs}`;
}

export function getDispatchHistoryLine(record: DispatchRecord): string {
  return `${record.status} @ ${new Date(record.transitions[record.transitions.length - 1]?.at ?? record.created_at).toLocaleString()}`;
}
