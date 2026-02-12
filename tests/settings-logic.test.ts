import { describe, it, expect } from 'vitest';
import { SettingsSchema, Settings } from '../lib/types';

describe('Settings Logic (Issue #7)', () => {
  const defaultSettings: Settings = {
    schema_version: 1,
    proposal_style: 'detailed',
    risk_level: 'medium',
    default_step_count: 5,
    timeline_mode: 'expanded',
  };

  it('validates settings with Zod', () => {
    const result = SettingsSchema.safeParse(defaultSettings);
    expect(result.success).toBe(true);
  });

  it('fails on invalid settings', () => {
    const invalid = { ...defaultSettings, proposal_style: 'invalid' };
    const result = SettingsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
