import { confirmBlockResidents, previewBlockResidents } from '../services/bulkImportService.js';
import { AppError, asyncHandler, created, ok, requireFields } from '../utils/http.js';
import BulkImport from '../models/BulkImport.js';
export const previewImport = asyncHandler(async (req, res) => { if (!req.file) throw new AppError(400, 'An Excel file is required.'); requireFields(req.body, ['blockName']); created(res, await previewBlockResidents({ buffer: req.file.buffer, blockName: req.body.blockName, user: req.user })); });
export const confirmImport = asyncHandler(async (req, res) => { requireFields(req.body, ['importId']); ok(res, await confirmBlockResidents({ importId: req.body.importId, confirm: req.body.confirm === true, user: req.user })); });
export const listImportJobs=asyncHandler(async(req,res)=>ok(res,await BulkImport.find({userId:req.user.userId}).select('-validRows -errorRows').sort({createdAt:-1}).lean()));
export const getImportJob=asyncHandler(async(req,res)=>{const job=await BulkImport.findOne({importId:req.params.importId,userId:req.user.userId}).lean();if(!job)throw new AppError(404,'Import job not found.');ok(res,job);});
export const cancelImportJob=asyncHandler(async(req,res)=>{const job=await BulkImport.findOneAndUpdate({importId:req.params.importId,userId:req.user.userId,status:'PREVIEWED'},{status:'CANCELLED'},{new:true});if(!job)throw new AppError(409,'Only a previewed import can be cancelled.');ok(res,job);});
