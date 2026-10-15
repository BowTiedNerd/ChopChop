import { describe, it, expect } from 'vitest';
import { existsSync, accessSync, constants, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { validateOutputPath } from './validation';

const fsApi = { existsSync, accessSync, W_OK: constants.W_OK };

describe('validateOutputPath', () => {
  it('rejects undefined segments, virtual filesystems and unwritable folders', () => {
    expect(() => validateOutputPath('undefined/x.json', fsApi)).toThrow(/defined/);
    expect(() => validateOutputPath('out/null/x.json', fsApi)).toThrow(/undefined segment/);
    expect(() => validateOutputPath('/proc/nope/x.json', fsApi)).toThrow(/virtual/);
    const denied = { ...fsApi, accessSync: () => { throw new Error('EACCES'); } };
    expect(() => validateOutputPath('/tmp/x.json', denied)).toThrow(/not writable/);
  });
  it('accepts a writable (possibly not yet created) folder', () => {
    const d = mkdtempSync(`${tmpdir()}/out-`);
    expect(() => validateOutputPath(`${d}/new/sub/x.json`, fsApi)).not.toThrow();
  });
});
