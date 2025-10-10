export function generateRandomString(length = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }
  
  // Generates a human-readable unique name like: e2e-thing-lmno12-maz8j
  export function generateUniqueName(prefix = 'e2e', randomLen = 6): string {
    return `${prefix}-${Date.now().toString(36)}-${generateRandomString(randomLen)}`;
  }
  