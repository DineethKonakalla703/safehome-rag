import Notification from '../models/Notification.js';import { AppError,asyncHandler,ok } from '../utils/http.js';
export const listNotifications=asyncHandler(async(req,res)=>ok(res,await Notification.find({$or:[{userId:req.user.userId},{role:req.user.role}]}).sort({createdAt:-1}).lean()));
export const readNotification=asyncHandler(async(req,res)=>{const record=await Notification.findOneAndUpdate({notificationId:req.params.id,$or:[{userId:req.user.userId},{role:req.user.role}]},{read:true},{new:true});if(!record)throw new AppError(404,'Notification not found.');ok(res,record);});
