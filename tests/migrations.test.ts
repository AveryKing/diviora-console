import { describe, it, expect, vi } from 'vitest';
import { migrateSnapshot, migrateLocalStorage } from '../lib/migrations';
import { SnapshotV1 } from '../lib/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Migrations Logic (Issue #9)', () => {
  const mockSettings = {
    schema_version: 1,
    proposal_style: 'detailed',
    risk_level: 'medium',
    default_step_count: 5,
    timeline_mode: 'expanded',
  };

  const v1Snapshot: SnapshotV1 = {
    snapshot_version: 1,
    exported_at: new Date().toISOString(),
    settings: mockSettings as SnapshotV1['settings'],
    proposals: [],
    decisions: [],
    runs: [],
  };

  it('migrates SnapshotV1 to SnapshotV2', () => {
    const v2 = migrateSnapshot(v1Snapshot);
    expect(v2.snapshot_version).toBe(2);
    expect(v2.state_schema_versions).toBeDefined();
    expect(v2.state_schema_versions.settings).toBe(1);
    expect(v2.app_version).toBe('0.1.0');
  });

  it('is idempotent for SnapshotV2', () => {
    const v2 = migrateSnapshot(v1Snapshot);
    const v2again = migrateSnapshot(v2);
    expect(v2again).toEqual(v2);
  });

  it('rejects malformed snapshots', () => {
    expect(() => migrateSnapshot({ snapshot_version: 99 })).toThrow();
  });

  it('migrates raw array localStorage to versioned collection', () => {
    localStorage.clear();
    const rawProposals = [{ proposal_id: 'p1', proposal: { title: 'T' } }];
    localStorage.setItem('diviora.proposals.v1', JSON.stringify(rawProposals));
    
    migrateLocalStorage();
    
    const migrated = JSON.parse(localStorage.getItem('diviora.proposals.v1')!);
    expect(migrated.schema_version).toBe(1);
    expect(migrated.items).toHaveLength(1);
  });

  it('migrates legacy diviora_proposals key', () => {
    localStorage.clear();
    const rawProposals = [{ proposal_id: 'p1', proposal: { title: 'T' } }];
    localStorage.setItem('diviora_proposals', JSON.stringify(rawProposals));
    
    migrateLocalStorage();
    
    const migrated = JSON.parse(localStorage.getItem('diviora.proposals.v1')!);
    expect(migrated.schema_version).toBe(1);
    expect(migrated.items).toHaveLength(1);
  });
});
