import User from '../models/User.js';
import { signToken } from '../utils/auth.js';
import { AppError, asyncHandler, ok, requireFields } from '../utils/http.js';
import crypto from 'node:crypto';
import { writeAudit } from '../utils/audit.js';

const safeUser = (user) => ({ userId: user.userId, name: user.name, email: user.email, role: user.role, communityId: user.communityId, blockId: user.blockId, apartmentId: user.apartmentId, technicianId: user.technicianId, status: user.status, activationStatus:user.activationStatus, mustChangePassword:user.mustChangePassword });

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw new AppError(401, 'Invalid email or password.');
  if (user.status !== 'Active') throw new AppError(403, 'This account is inactive.');
  ok(res, { token: signToken(user), user: safeUser(user) });
});

export const me = asyncHandler(async (req, res) => ok(res, safeUser(req.user)));
export const changePassword=asyncHandler(async(req,res)=>{requireFields(req.body,['currentPassword','newPassword']);if(String(req.body.newPassword).length<8)throw new AppError(400,'New password must contain at least 8 characters.');const user=await User.findOne({userId:req.user.userId}).select('+password');if(!(await user.comparePassword(req.body.currentPassword)))throw new AppError(401,'Current password is incorrect.');user.password=req.body.newPassword;user.mustChangePassword=false;user.activationStatus='ACTIVE';user.activatedAt=new Date();await user.save();await writeAudit({action:'PASSWORD_CHANGED',entityType:'User',entityId:user.userId,actorId:user.userId,message:'Password changed securely.'});ok(res,{changed:true});});
export const requestPasswordReset=asyncHandler(async(req,res)=>{requireFields(req.body,['email']);const user=await User.findOne({email:String(req.body.email).toLowerCase()}).select('+passwordResetTokenHash +passwordResetExpiresAt');let token=null;if(user){token=crypto.randomBytes(24).toString('hex');user.passwordResetTokenHash=crypto.createHash('sha256').update(token).digest('hex');user.passwordResetExpiresAt=new Date(Date.now()+30*60000);await user.save();}ok(res,{message:'If the account exists, reset instructions have been generated.',...(process.env.NODE_ENV!=='production'&&token?{demoResetToken:token}:{})});});
export const resetPassword=asyncHandler(async(req,res)=>{requireFields(req.body,['token','newPassword']);if(String(req.body.newPassword).length<8)throw new AppError(400,'New password must contain at least 8 characters.');const hash=crypto.createHash('sha256').update(req.body.token).digest('hex');const user=await User.findOne({passwordResetTokenHash:hash,passwordResetExpiresAt:{$gt:new Date()}}).select('+password +passwordResetTokenHash +passwordResetExpiresAt');if(!user)throw new AppError(400,'Reset token is invalid or expired.');user.password=req.body.newPassword;user.passwordResetTokenHash=null;user.passwordResetExpiresAt=null;user.mustChangePassword=false;user.activationStatus='ACTIVE';user.activatedAt=new Date();await user.save();await writeAudit({action:'PASSWORD_RESET',entityType:'User',entityId:user.userId,actorId:user.userId,message:'Password reset completed.'});ok(res,{reset:true});});
export const resendInvite=asyncHandler(async(req,res)=>{const user=await User.findOne({userId:req.params.id});if(!user)throw new AppError(404,'User not found.');const temporaryPassword=`Safe@${crypto.randomBytes(4).toString('hex')}1`;user.password=temporaryPassword;user.mustChangePassword=true;user.activationStatus='PENDING';user.invitedAt=new Date();await user.save();await writeAudit({action:'USER_INVITE_RESENT',entityType:'User',entityId:user.userId,actorId:req.user.userId,message:'Account invitation regenerated.'});ok(res,{userId:user.userId,activationStatus:user.activationStatus,...(process.env.NODE_ENV!=='production'?{temporaryPassword}:{})});});
