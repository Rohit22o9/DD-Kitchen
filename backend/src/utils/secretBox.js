/**
 * AES-256-GCM encryption for small secrets stored in the database (2FA keys).
 * Uses ENCRYPTION_KEY, or a key derived from JWT_SECRET if that isn't set.
 * Note: if the key changes, staff must re-enrol two-factor authentication.
 */
const crypto = require('crypto');
const env = require('../config/env');

const key = () => crypto.createHash('sha256').update(`dd-secretbox:${env.ENCRYPTION_KEY || env.JWT_SECRET}`).digest();

const seal = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${enc.toString('base64url')}`;
};

const open = (sealed) => {
  const [v, iv, tag, data] = String(sealed || '').split('.');
  if (v !== 'v1') throw new Error('Unknown secret format');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
};

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

module.exports = { seal, open, sha256 };
