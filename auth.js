import { randomBytes, scrypt as scryptCallback, pbkdf2 as pbkdf2Callback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
const pbkdf2 = promisify(pbkdf2Callback);
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 5, maxmem: 64 * 1024 * 1024 };
export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
export function validPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts[0] === 'pbkdf2-sha256-chain6') {
    const [, rounds, salt, digest, extra] = parts;
    if (extra !== undefined || rounds !== '100000' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{64}$/.test(digest || '')) return false;
    let material = Buffer.from(password, 'utf8');
    for (let round = 0; round < 6; round++) material = await pbkdf2(material, `${salt}:${round}`, 100000, 32, 'sha256');
    return timingSafeEqual(material, Buffer.from(digest, 'hex'));
  }
  const [algorithm, salt, digest, extra] = parts;
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(digest || '') || extra !== undefined) return false;
  const derived = await scrypt(password, salt, 64, SCRYPT_OPTIONS);
  return timingSafeEqual(derived, Buffer.from(digest, 'hex'));
}
export function createSessionToken() { return randomBytes(32).toString('hex'); }
export function tokenHash(token) { return createHash('sha256').update(token).digest('hex'); }

