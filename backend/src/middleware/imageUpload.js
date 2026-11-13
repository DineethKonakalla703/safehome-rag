import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { fileURLToPath } from 'node:url';

const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/tickets');
fs.mkdirSync(uploadDir, { recursive: true });
const allowed = new Map([['image/jpeg', new Set(['.jpg', '.jpeg'])], ['image/png', new Set(['.png'])], ['image/webp', new Set(['.webp'])]]);
const storage = multer.diskStorage({ destination: uploadDir, filename: (_req, file, callback) => { const ext = path.extname(file.originalname).toLowerCase(); callback(null, `${Date.now()}-${crypto.randomUUID()}${ext}`); } });
export const imageUpload = multer({ storage, limits: { fileSize: Number(process.env.MAX_IMAGE_UPLOAD_MB || 5) * 1024 * 1024, files: 1 }, fileFilter: (_req, file, callback) => { const ext = path.extname(file.originalname).toLowerCase(); callback(allowed.get(file.mimetype)?.has(ext) ? null : new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.'), Boolean(allowed.get(file.mimetype)?.has(ext))); } });
export const validImageSignature = (buffer, mime) => mime === 'image/jpeg' ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff : mime === 'image/png' ? buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])) : mime === 'image/webp' ? buffer.subarray(0,4).toString() === 'RIFF' && buffer.subarray(8,12).toString() === 'WEBP' : false;
export const ticketUploadDirectory = uploadDir;
