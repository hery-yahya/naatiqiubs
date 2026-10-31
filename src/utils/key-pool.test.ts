import test from 'node:test';
import assert from 'node:assert/strict';
import { GeminiKeyPool, extractKeysFromEnv } from './key-pool';

test('extractKeysFromEnv handles single key, comma list, and numbered vars', () => {
  const envSingle = { GEMINI_API_KEY: 'AIzaSyKey1' };
  assert.deepEqual(extractKeysFromEnv(envSingle), ['AIzaSyKey1']);

  const envComma = { GEMINI_API_KEYS: 'AIzaSyKey1, AIzaSyKey2 , AIzaSyKey3' };
  assert.deepEqual(extractKeysFromEnv(envComma), ['AIzaSyKey1', 'AIzaSyKey2', 'AIzaSyKey3']);

  const envNumbered = {
    GEMINI_API_KEY: 'AIzaKeyA',
    GEMINI_API_KEY_2: 'AIzaKeyB',
    GEMINI_API_KEY_3: 'AIzaKeyC',
    GEMINI_API_KEY_BACKUP: 'AIzaKeyD',
  };
  const extracted = extractKeysFromEnv(envNumbered);
  assert.equal(extracted.length, 4);
  assert.ok(extracted.includes('AIzaKeyA'));
  assert.ok(extracted.includes('AIzaKeyB'));
  assert.ok(extracted.includes('AIzaKeyC'));
  assert.ok(extracted.includes('AIzaKeyD'));
});

test('GeminiKeyPool masks keys securely', () => {
  const pool = new GeminiKeyPool(['AIzaSyABC123XYZ987']);
  const status = pool.getStatusList();
  assert.equal(status.length, 1);
  assert.equal(status[0].masked, 'AIza...Z987');
  assert.equal(status[0].isExhausted, false);
});

test('GeminiKeyPool failover automatically switches to next key on quota error', async () => {
  const pool = new GeminiKeyPool(['KEY_EXHAUSTED_1', 'KEY_EXHAUSTED_2', 'KEY_HEALTHY_3']);

  const calls: string[] = [];

  const { result, keyIndex } = await pool.executeWithFailover(
    async (key) => {
      calls.push(key);
      if (key === 'KEY_EXHAUSTED_1' || key === 'KEY_EXHAUSTED_2') {
        const err: any = new Error('429 RESOURCE_EXHAUSTED: Quota exceeded');
        err.status = 429;
        throw err;
      }
      return 'SUCCESS_FROM_' + key;
    },
    (err) => err?.status === 429 || String(err).includes('429')
  );

  assert.equal(result, 'SUCCESS_FROM_KEY_HEALTHY_3');
  assert.equal(keyIndex, 2);
  assert.deepEqual(calls, ['KEY_EXHAUSTED_1', 'KEY_EXHAUSTED_2', 'KEY_HEALTHY_3']);

  // Check status: first two keys are now marked exhausted
  const status = pool.getStatusList();
  assert.equal(status[0].isExhausted, true);
  assert.equal(status[1].isExhausted, true);
  assert.equal(status[2].isExhausted, false);
});

test('GeminiKeyPool throws ALL_KEYS_EXHAUSTED when all keys fail quota', async () => {
  const pool = new GeminiKeyPool(['KEY1', 'KEY2']);

  await assert.rejects(
    async () => {
      await pool.executeWithFailover(
        async () => {
          const err: any = new Error('Quota exceeded 429');
          err.status = 429;
          throw err;
        },
        (err) => String(err).includes('429')
      );
    },
    { message: 'ALL_KEYS_EXHAUSTED' }
  );
});
