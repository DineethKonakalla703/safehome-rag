import Block from '../models/Block.js';
import Community from '../models/Community.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';
import { scopedFilter } from '../middleware/auth.js';
import { writeAudit } from '../utils/audit.js';

function resourceFilter(user, scope) {
  if (scope.unrestrictedRead) return {};
  if (scope.residentUsesBlock && user.role === 'RESIDENT') return { [scope.blockField || 'blockId']: user.blockId };
  if (scope.includeGlobalRecords && ['RESIDENT', 'BLOCK_SUB_ADMIN', 'SECURITY'].includes(user.role)) return { $or: [{ [scope.blockField || 'blockId']: user.blockId }, { [scope.blockField || 'blockId']: null }] };
  return scopedFilter(user, scope);
}

export function createResourceController({ Model, idField, prefix, required = [], scope = {}, defaults = {}, sort = { createdAt: -1 } }) {
  return {
    list: asyncHandler(async (req, res) => ok(res, await Model.find(resourceFilter(req.user, scope)).sort(sort).lean())),
    get: asyncHandler(async (req, res) => {
      const record = await Model.findOne({ [idField]: req.params.id, ...resourceFilter(req.user, scope) }).lean();
      if (!record) throw new AppError(404, 'Record not found.');
      ok(res, record);
    }),
    create: asyncHandler(async (req, res) => {
      const body = { ...req.body };
      if (Model.schema.path('communityId') && Model.modelName !== 'Community') {
        // Main Admin manages every community: honour an explicit communityId, or inherit it from the block.
        if (req.user.role === 'MAIN_ADMIN' && !body.communityId && body.blockId && Model.modelName !== 'Block') {
          const block = await Block.findOne({ blockId: body.blockId }).select('communityId').lean();
          if (block) body.communityId = block.communityId;
        }
        if (req.user.role === 'MAIN_ADMIN' && body.communityId) {
          if (!(await Community.exists({ communityId: body.communityId }))) throw new AppError(400, `Community ${body.communityId} does not exist.`);
        } else if (req.user.communityId) body.communityId = req.user.communityId;
      }
      if (req.user.role === 'MAIN_ADMIN' && body.blockId && Model.schema.path('blockId') && Model.modelName !== 'Block' && !(await Block.exists({ blockId: body.blockId }))) throw new AppError(400, `Block ${body.blockId} does not exist.`);
      if (['BLOCK_SUB_ADMIN', 'SECURITY'].includes(req.user.role) && Model.schema.path(scope.blockField || 'blockId')) body[scope.blockField || 'blockId'] = req.user.blockId;
      if (req.user.role === 'BLOCK_SUB_ADMIN' && Model.modelName === 'Notice') body.targetType = 'Block';
      if (req.user.role === 'RESIDENT') {
        if (Model.schema.path(scope.residentField || 'residentId')) body[scope.residentField || 'residentId'] = req.user.userId;
        if (Model.schema.path(scope.blockField || 'blockId')) body[scope.blockField || 'blockId'] = req.user.blockId;
        if (Model.schema.path('apartmentId')) body.apartmentId = req.user.apartmentId;
      }
      requireFields(body, required);
      const publicId = await nextPublicId(Model, idField, prefix);
      const record = await Model.create({ ...defaults, ...body, [idField]: publicId, createdBy: body.createdBy || req.user.userId, uploadedBy: body.uploadedBy || req.user.userId, lastUpdatedBy: body.lastUpdatedBy || req.user.userId });
      await writeAudit({ action: `${Model.modelName.toUpperCase()}_CREATED`, entityType: Model.modelName, entityId: publicId, actorId: req.user.userId, message: `${Model.modelName} ${publicId} created.` });
      created(res, record);
    }),
    update: asyncHandler(async (req, res) => {
      const body = { ...req.body }; delete body[idField];
      if (req.user.role !== 'MAIN_ADMIN') { delete body.communityId; delete body.blockId; delete body.residentId; }
      const record = await Model.findOneAndUpdate({ [idField]: req.params.id, ...resourceFilter(req.user, scope) }, { ...body, lastUpdatedBy: req.user.userId }, { new: true, runValidators: true });
      if (!record) throw new AppError(404, 'Record not found.');
      await writeAudit({ action: `${Model.modelName.toUpperCase()}_UPDATED`, entityType: Model.modelName, entityId: req.params.id, actorId: req.user.userId, message: `${Model.modelName} ${req.params.id} updated.` });
      ok(res, record);
    }),
    remove: asyncHandler(async (req, res) => {
      const record = await Model.findOneAndDelete({ [idField]: req.params.id, ...resourceFilter(req.user, scope) });
      if (!record) throw new AppError(404, 'Record not found.');
      await writeAudit({ action: `${Model.modelName.toUpperCase()}_DELETED`, entityType: Model.modelName, entityId: req.params.id, actorId: req.user.userId, message: `${Model.modelName} ${req.params.id} deleted.` });
      ok(res, { id: req.params.id, deleted: true });
    }),
  };
}
