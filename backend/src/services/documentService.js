/**
 * Compliance documents (food safety certificate, public liability insurance)
 * are stored privately in MongoDB GridFS and only served to the owner or an
 * admin. Previously they lived only in the browser's localStorage.
 */
const mongoose = require('mongoose');
const { Readable } = require('stream');

const BUCKET = 'compliance_docs';
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES = 5 * 1024 * 1024;
const KINDS = ['food_safety_cert', 'liability_insurance'];

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });

/** Check magic bytes so a renamed executable can't pass as a PDF. */
const sniffType = (buf) => {
  if (buf.slice(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return null;
};

const save = (buffer, filename, contentType, metadata) =>
  new Promise((resolve, reject) => {
    const upload = bucket().openUploadStream(filename, { metadata: { ...metadata, contentType } });
    Readable.from(buffer).pipe(upload).on('error', reject).on('finish', () => resolve(upload.id));
  });

const remove = async (fileId) => {
  try {
    await bucket().delete(fileId);
  } catch {
    /* already gone */
  }
};

const stream = (fileId) => bucket().openDownloadStream(fileId);

module.exports = { ALLOWED_TYPES, MAX_BYTES, KINDS, sniffType, save, remove, stream };
