export interface KeyEntry {
  key: string;
  masked: string;
  exhaustedUntil: number; // timestamp in ms, 0 if healthy
}

export class GeminiKeyPool {
  private keys: KeyEntry[] = [];
  private currentIndex = 0;

  constructor(initialKeys: string[] = []) {
    this.setKeys(initialKeys);
  }

  public setKeys(rawKeys: string[]): void {
    const uniqueKeys = Array.from(
      new Set(
        rawKeys
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
      )
    );

    this.keys = uniqueKeys.map((k) => ({
      key: k,
      masked: this.maskKey(k),
      exhaustedUntil: 0,
    }));
    this.currentIndex = 0;
  }

  public get totalKeys(): number {
    return this.keys.length;
  }

  private maskKey(k: string): string {
    if (k.length <= 8) return '****';
    return `${k.slice(0, 4)}...${k.slice(-4)}`;
  }

  public getAvailableKey(): { key: string; index: number } | null {
    if (this.keys.length === 0) return null;

    const now = Date.now();
    // Reset any keys whose quota exhaustion cooldown has expired (default 1 hour cooldown)
    this.keys.forEach((entry) => {
      if (entry.exhaustedUntil > 0 && now >= entry.exhaustedUntil) {
        entry.exhaustedUntil = 0;
      }
    });

    // Find the next available non-exhausted key starting from currentIndex
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      if (this.keys[idx].exhaustedUntil === 0) {
        this.currentIndex = idx;
        return { key: this.keys[idx].key, index: idx };
      }
    }

    // All keys are currently exhausted
    return null;
  }

  public markExhausted(index: number, cooldownMs = 60 * 60 * 1000): void {
    if (index >= 0 && index < this.keys.length) {
      this.keys[index].exhaustedUntil = Date.now() + cooldownMs;
      // Advance current index to next key
      this.currentIndex = (index + 1) % this.keys.length;
    }
  }

  public getStatusList() {
    const now = Date.now();
    return this.keys.map((k, idx) => ({
      index: idx + 1,
      masked: k.masked,
      isExhausted: k.exhaustedUntil > 0 && now < k.exhaustedUntil,
      isCurrent: idx === this.currentIndex,
    }));
  }

  /**
   * Automatically executes a function with failover across available keys.
   * If an attempt encounters a 429 quota error, it marks that key as exhausted
   * and immediately retries with the next available key.
   */
  public async executeWithFailover<T>(
    operation: (key: string, index: number) => Promise<T>,
    isQuotaError: (err: any) => boolean
  ): Promise<{ result: T; keyIndex: number; totalKeys: number }> {
    if (this.keys.length === 0) {
      throw new Error('NO_KEYS_CONFIGURED');
    }

    const attemptedIndices = new Set<number>();

    while (attemptedIndices.size < this.keys.length) {
      const available = this.getAvailableKey();
      if (!available || attemptedIndices.has(available.index)) {
        break;
      }

      attemptedIndices.add(available.index);

      try {
        const result = await operation(available.key, available.index);
        return {
          result,
          keyIndex: available.index,
          totalKeys: this.keys.length,
        };
      } catch (err: any) {
        if (isQuotaError(err)) {
          console.warn(
            `[KeyPool] Key #${available.index + 1} (${this.keys[available.index].masked}) hit quota limit (429). Switching to next key...`
          );
          this.markExhausted(available.index);
          // Loop continues to attempt next key
        } else {
          // Non-quota error (e.g. syntax, prompt error), throw immediately
          throw err;
        }
      }
    }

    throw new Error('ALL_KEYS_EXHAUSTED');
  }
}

/**
 * Extracts all Gemini API keys from environment variables.
 * Supports:
 * - GEMINI_API_KEYS="key1,key2,key3" or multiline
 * - GEMINI_API_KEY
 * - GEMINI_API_KEY_2, GEMINI_API_KEY_3, GEMINI_API_KEY_4, GEMINI_API_KEY_5
 * - GEMINI_API_KEY_BACKUP
 */
export function extractKeysFromEnv(env: Record<string, string | undefined>): string[] {
  const result: string[] = [];

  // Comma or newline separated list
  if (env.GEMINI_API_KEYS) {
    const split = env.GEMINI_API_KEYS.split(/[\n,;]+/).map((s) => s.trim());
    result.push(...split);
  }

  // Primary key
  if (env.GEMINI_API_KEY) {
    // If user provided comma-separated in primary key
    if (env.GEMINI_API_KEY.includes(',')) {
      result.push(...env.GEMINI_API_KEY.split(',').map((s) => s.trim()));
    } else {
      result.push(env.GEMINI_API_KEY.trim());
    }
  }

  // Numbered or backup keys
  for (let i = 2; i <= 10; i++) {
    const numberedKey = env[`GEMINI_API_KEY_${i}`];
    if (numberedKey) {
      result.push(numberedKey.trim());
    }
  }

  if (env.GEMINI_API_KEY_BACKUP) {
    result.push(env.GEMINI_API_KEY_BACKUP.trim());
  }

  return Array.from(new Set(result.filter((k) => k.length > 0)));
}
