import Notification from '../models/Notification.js';
import { nextPublicId } from '../utils/http.js';
import { sendSmsAlert, sendWhatsAppAlert, sendWebPushNotification } from './communicationService.js';

export async function createSystemNotification({
  userId = null,
  role = null,
  title,
  message,
  type = 'INFO',
  entityType = null,
  entityId = null,
}) {
  try {
    const notificationId = await nextPublicId(Notification, 'notificationId', 'N');
    const notif = await Notification.create({
      notificationId,
      userId,
      role,
      title,
      message,
      type,
      entityType,
      entityId,
      read: false,
    });
    // Trigger web push broadcast for critical alerts
    if (type === 'CRITICAL_SAFETY' || type === 'SLA_ALERT') {
      sendWebPushNotification({ title, body: message, url: `/tickets/${entityId}` }).catch(() => {});
    }
    return notif;
  } catch (err) {
    console.warn(`Notification dispatch skipped: ${err.message}`);
    return null;
  }
}

export async function notifyTicketCreated(ticket) {
  if (ticket.safetyRisk || ticket.severity === 'Critical') {
    await createSystemNotification({
      role: 'MAIN_ADMIN',
      title: `URGENT Safety Risk: ${ticket.ticketId}`,
      message: `${ticket.title} in Block ${ticket.blockId} has been classified as a Critical/High safety risk. Immediate response required.`,
      type: 'CRITICAL_SAFETY',
      entityType: 'Ticket',
      entityId: ticket.ticketId,
    });
    await createSystemNotification({
      role: 'FACILITY_MANAGER',
      title: `URGENT Safety Incident: ${ticket.ticketId}`,
      message: `${ticket.title} in Block ${ticket.blockId} requires facility manager review.`,
      type: 'CRITICAL_SAFETY',
      entityType: 'Ticket',
      entityId: ticket.ticketId,
    });
  } else {
    await createSystemNotification({
      role: 'MAIN_ADMIN',
      title: `New Ticket: ${ticket.ticketId}`,
      message: `${ticket.title} logged for Unit ${ticket.apartmentId} (${ticket.category}).`,
      type: 'TICKET',
      entityType: 'Ticket',
      entityId: ticket.ticketId,
    });
  }
}

export async function notifyTechnicianAssigned(ticket, technicianName, techId) {
  // Alert Resident
  await createSystemNotification({
    userId: ticket.residentId,
    title: `Technician Assigned: ${ticket.ticketId}`,
    message: `${technicianName} has been assigned to your ticket "${ticket.title}".`,
    type: 'WORK_ORDER',
    entityType: 'Ticket',
    entityId: ticket.ticketId,
  });

  // Alert Technician
  await createSystemNotification({
    role: 'TECHNICIAN',
    title: `New Work Order: ${ticket.ticketId}`,
    message: `You have been assigned to: ${ticket.title} (Unit ${ticket.apartmentId}).`,
    type: 'WORK_ORDER',
    entityType: 'Ticket',
    entityId: ticket.ticketId,
  });
}

export async function notifyWorkOrderCompleted(order, ticket) {
  // Alert Resident
  if (ticket?.residentId) {
    await createSystemNotification({
      userId: ticket.residentId,
      title: `Work Completed & Verified: ${ticket.ticketId}`,
      message: `Your maintenance request "${ticket.title}" has been completed. Photo proof attached.`,
      type: 'WORK_ORDER',
      entityType: 'Ticket',
      entityId: ticket.ticketId,
    });
  }

  // Alert Admin
  await createSystemNotification({
    role: 'MAIN_ADMIN',
    title: `Work Order Completed: ${order.workOrderId}`,
    message: `Technician resolved ${order.title}. Completion note: "${order.completionNote || 'Done'}".`,
    type: 'WORK_ORDER',
    entityType: 'WorkOrder',
    entityId: order.workOrderId,
  });
}

export async function notifyBillCreated(bill) {
  await createSystemNotification({
    userId: bill.residentId,
    title: `New Invoice Generated: ${bill.billId}`,
    message: `A new ${bill.billType || 'service'} charge of ₹${bill.totalAmount} is due by ${bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'two weeks'}.`,
    type: 'BILL',
    entityType: 'Bill',
    entityId: bill.billId,
  });
}

export async function notifyBillPaid(bill) {
  await createSystemNotification({
    userId: bill.residentId,
    title: `Payment Received: ${bill.billId}`,
    message: `Thank you! Payment of ₹${bill.totalAmount} was received. Official Receipt: ${bill.receiptNumber || 'Confirmed'}.`,
    type: 'BILL',
    entityType: 'Bill',
    entityId: bill.billId,
  });
}

export async function notifyVisitorEvent(visitor, eventType) {
  if (eventType === 'CHECKED_IN') {
    await createSystemNotification({
      userId: visitor.residentId,
      title: `Visitor Checked In: ${visitor.name}`,
      message: `${visitor.name} has entered through the security gate for Unit ${visitor.apartmentId}.`,
      type: 'VISITOR',
      entityType: 'Visitor',
      entityId: visitor.visitorId,
    });
  } else if (eventType === 'REGISTERED') {
    await createSystemNotification({
      role: 'SECURITY',
      title: `New Gate Pass: ${visitor.name}`,
      message: `Visitor pass ${visitor.passCode || visitor.visitorId} pre-approved for Unit ${visitor.apartmentId}.`,
      type: 'VISITOR',
      entityType: 'Visitor',
      entityId: visitor.visitorId,
    });
  }
}
