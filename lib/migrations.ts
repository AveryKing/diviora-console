import { SnapshotV1Schema, SnapshotV2Schema, SnapshotV3 } from './types';

const STORAGE_KEY_PROPOSALS = 'diviora.proposals.v1';
const STORAGE_KEY_DECISIONS = 'diviora.decisions.v1';
const STORAGE_KEY_RUNS = 'diviora.runs.v1';
const STORAGE_KEY_PROJECT_SNAPSHOTS = 'diviora.project_snapshots.v1';
const STORAGE_KEY_AGENT_PACKS = 'diviora.agent_packs.v1';

/**
 * Migrates a snapshot from any supported version to the latest (V3).
 */
export function migrateSnapshot(input: unknown): SnapshotV3 {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid snapshot: input is not an object');
  }

  const snapshot = input as { snapshot_version?: number };

  // Already latest version
  if (snapshot.snapshot_version === 3) {
    return input as SnapshotV3;
  }

  // Migrate V2 -> V3
  if (snapshot.snapshot_version === 2) {
    const result = SnapshotV2Schema.safeParse(input);
    if (!result.success) {
      throw new Error(`Invalid SnapshotV2: ${result.error.issues[0].message}`);
    }
    const v2 = result.data;
    return {
      snapshot_version: 3,
      exported_at: v2.exported_at,
      app_version: v2.app_version,
      state_schema_versions: {
        ...v2.state_schema_versions,
        transcripts: 1,
      },
      settings: v2.settings,
      proposals: v2.proposals,
      decisions: v2.decisions,
      runs: v2.runs,
      transcripts: [],
    };
  }

  // Migrate V1 -> V3
  if (snapshot.snapshot_version === 1) {
    const result = SnapshotV1Schema.safeParse(input);
    if (!result.success) {
      throw new Error(`Invalid SnapshotV1: ${result.error.issues[0].message}`);
    }
    const v1 = result.data;
    return {
      snapshot_version: 3,
      exported_at: v1.exported_at,
      app_version: v1.app_version || '0.1.0',
      state_schema_versions: {
        settings: 1,
        proposals: 1,
        decisions: 1,
        runs: 1,
        transcripts: 1,
      },
      settings: v1.settings,
      proposals: v1.proposals,
      decisions: v1.decisions,
      runs: v1.runs,
      transcripts: [],
    };
  }

  throw new Error(`Unsupported snapshot version: ${snapshot.snapshot_version}`);
}

/**
 * Migrates localStorage data from legacy formats to structured/versioned formats.
 * This is idempotent and fail-closed.
 */
export function migrateLocalStorage(): { ok: true } | { ok: false, error: string } {
  try {
    // 1. Migrate legacy 'diviora_proposals' if it exists and target is empty
    const legacyProposals = localStorage.getItem('diviora_proposals');
    if (legacyProposals && !localStorage.getItem(STORAGE_KEY_PROPOSALS)) {
      localStorage.setItem(STORAGE_KEY_PROPOSALS, legacyProposals);
      // We don't delete yet to be extra safe, just copy.
    }

    // 2. Migrate raw arrays to { schema_version: 1, items: [] }
    const keys = [STORAGE_KEY_PROPOSALS, STORAGE_KEY_DECISIONS, STORAGE_KEY_RUNS, STORAGE_KEY_PROJECT_SNAPSHOTS, STORAGE_KEY_AGENT_PACKS];
    for (const key of keys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            localStorage.setItem(key, JSON.stringify({
              schema_version: 1,
              items: parsed
            }));
          }
        } catch (e) {
          console.error(`Local migration failed for ${key}`, e);
        }
      }
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown migration error' };
  }
}
