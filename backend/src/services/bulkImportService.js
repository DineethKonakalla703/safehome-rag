import Apartment from '../models/Apartment.js';
import Block from '../models/Block.js';
import BulkImport from '../models/BulkImport.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Resident from '../models/Resident.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { writeAIAudit } from '../ai/aiAuditLogger.js';
import { AppError, nextPublicId } from '../utils/http.js';
import { parseResidentWorkbook, requiredExcelColumns } from '../utils/excelParser.js';
import mongoose from 'mongoose';

const emailOk = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneOk = (value) => /^\+?[0-9]{7,15}$/.test(value);
const enumOk = (value, allowed) => !value || allowed.includes(value.toUpperCase());
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function previewBlockResidents({ buffer, blockName, user }) {
  const { headers, rows } = parseResidentWorkbook(buffer);
  const missingColumns = requiredExcelColumns.filter((column) => !headers.includes(column));
  if (missingColumns.length) throw new AppError(400, `Missing required columns: ${missingColumns.join(', ')}`);
  const normalizedBlockName = String(blockName).trim();
  const block = await Block.findOne({ communityId: user.communityId, name: new RegExp(`^${escapeRegExp(normalizedBlockName)}$`, 'i') }).lean();
  const seenFlats = new Set(); const validRows = []; const errorRows = []; const warnings = block ? [`Block ${blockName} already exists. Confirmation will add only validated non-duplicate records to it.`] : [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]; const errors = []; const flat = row.flat_number.toUpperCase();
    if (!flat || !row.floor_number || !row.resident_name || !row.phone) errors.push('Required value missing.');
    if (seenFlats.has(flat)) errors.push('Duplicate flat number in workbook.'); seenFlats.add(flat);
    if (!phoneOk(row.phone)) errors.push('Invalid phone number.');
    if (!emailOk(row.email)) errors.push('Invalid email address.');
    if (!enumOk(row.resident_type, ['OWNER', 'TENANT'])) errors.push('resident_type must be OWNER or TENANT.');
    if (!enumOk(row.ownership_type, ['OWNED', 'RENTED'])) errors.push('ownership_type must be OWNED or RENTED.');
    const apartmentExists = block ? await Apartment.exists({ blockId: block.blockId, number: flat }) : false;
    const residentExists = row.email ? await User.exists({ email: row.email.toLowerCase() }) : await User.exists({ phone: row.phone, role: 'RESIDENT' });
    if (apartmentExists) errors.push('Apartment already exists.');
    if (residentExists) errors.push('Resident already exists.');
    const normalized = { ...row, flat_number: flat, resident_type: row.resident_type.toUpperCase(), ownership_type: row.ownership_type.toUpperCase(), rowNumber: index + 2 };
    (errors.length ? errorRows : validRows).push(errors.length ? { ...normalized, errors } : normalized);
  }
  const importId = await nextPublicId(BulkImport, 'importId', 'IMP');
  const previewSummary={ blocksToCreate: block ? 0 : 1, apartmentsToCreate: validRows.length, residentsToCreate: validRows.length, rowsWithErrors: errorRows.length };
  const record = await BulkImport.create({ importId, userId: user.userId, uploadedBy:user.userId, communityId: user.communityId, blockName: normalizedBlockName, validRows, errorRows, warnings,previewSummary });
  await writeAIAudit({ action: 'BULK_IMPORT_PREVIEW_GENERATED', entityType: 'BulkImport', entityId: importId, actorId: user.userId, message: `${validRows.length} valid and ${errorRows.length} invalid rows previewed.` });
  return { importId, blockName: record.blockName, summary:previewSummary, validRows, errorRows, warnings, requiresConfirmation: true };
}

export async function confirmBlockResidents({ importId, confirm, user }) {
  const record = await BulkImport.findOne({ importId, userId: user.userId });
  if (!record) throw new AppError(404, 'Import preview not found or expired.');
  if (!confirm) { record.status = 'CANCELLED'; await record.save(); return { success: false, cancelled: true }; }
  if (record.status !== 'PREVIEWED') throw new AppError(409, `Import is already ${record.status.toLowerCase()}.`);
  const created = { blocks: 0, apartments: 0, residents: 0, users: 0, vehicles: 0 }; const skipped = [];
  const session=await mongoose.startSession();
  try {
    await writeAIAudit({ action: 'BULK_IMPORT_CONFIRMED', entityType: 'BulkImport', entityId: importId, actorId: user.userId, message: 'Main Admin confirmed the validated import preview.' });
    record.status='CONFIRMED';record.confirmedAt=new Date();await record.save();
    await session.withTransaction(async()=>{
    let block = await Block.findOne({ communityId: record.communityId, name: new RegExp(`^${escapeRegExp(record.blockName)}$`, 'i') }).session(session);
    if (!block) { const blockId = await nextPublicId(Block, 'blockId', 'B'); block = new Block({ blockId, name: record.blockName, communityId: record.communityId });await block.save({session}); created.blocks += 1; }
    for (const row of record.validRows) {
      if (await Apartment.exists({ blockId: block.blockId, number: row.flat_number })) { skipped.push({ rowNumber: row.rowNumber, reason: 'Apartment already exists.' }); continue; }
      const apartmentId = await nextPublicId(Apartment, 'apartmentId', 'APT');
      const userId = await nextPublicId(User, 'userId', 'U');
      const email = row.email || `resident.${importId.toLowerCase()}.${row.rowNumber}@safehome.local`;
      if (await User.exists({ $or: [{ email: email.toLowerCase() }, { phone: row.phone, role: 'RESIDENT' }] })) { skipped.push({ rowNumber: row.rowNumber, reason: 'Resident already exists.' }); continue; }
      const apartment=new Apartment({ apartmentId, number: row.flat_number, floorNumber: row.floor_number, blockId: block.blockId, communityId: record.communityId, status: 'Occupied' });await apartment.save({session}); created.apartments += 1;
      const ownerOrTenant = row.resident_type === 'OWNER' || row.ownership_type === 'OWNED' ? 'Owner' : 'Tenant';
      const account=new User({ userId, name: row.resident_name, email, password: 'Demo@123', role: 'RESIDENT', communityId: record.communityId, blockId: block.blockId, apartmentId, phone: row.phone, ownerOrTenant, moveInDate: row.move_in_date || null, status: 'Active',activationStatus:'PENDING',mustChangePassword:true,invitedAt:new Date() });await account.save({session}); created.users += 1;
      const resident=new Resident({ residentId: userId, name: row.resident_name, email, phone: row.phone, apartmentId, blockId: block.blockId, communityId: record.communityId, ownerOrTenant, moveInDate: row.move_in_date || null, status: 'Active' });await resident.save({session}); created.residents += 1;
      if (row.vehicle_number) {
        const vehicleId = await nextPublicId(Vehicle, 'vehicleId', 'VEH');
        const vehicle=new Vehicle({ vehicleId, residentId: userId, apartmentId, blockId: block.blockId, vehicleNumber: row.vehicle_number, vehicleType: 'Car' });await vehicle.save({session}); created.vehicles += 1;
        if (row.parking_slot && !(await ParkingSlot.exists({ blockId: block.blockId, slotNumber: row.parking_slot }).session(session))) { const slotId = await nextPublicId(ParkingSlot, 'slotId', 'PS'); const slot=new ParkingSlot({ slotId, blockId: block.blockId, slotNumber: row.parking_slot, status: 'Assigned', assignedTo: vehicleId });await slot.save({session}); }
      }
    }
    });
    record.status = 'COMPLETED'; record.result = { created, skipped };record.createdRecords=created;record.completedAt=new Date(); await record.save();
    const audit = await writeAIAudit({ action: 'BULK_IMPORT_COMPLETED', entityType: 'BulkImport', entityId: importId, actorId: user.userId, message: `${created.residents} residents imported after confirmation.` });
    return { success: true, created, skipped, auditLogId: String(audit._id) };
  } catch (error) {
    record.status = 'FAILED'; record.errorMessage=error.message; record.result = { message: error.message }; await record.save();
    await writeAIAudit({ action: 'BULK_IMPORT_FAILED', entityType: 'BulkImport', entityId: importId, actorId: user.userId, message: `Import failed: ${error.message}` });
    throw error;
  }finally{await session.endSession();}
}
