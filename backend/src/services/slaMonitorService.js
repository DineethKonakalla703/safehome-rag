import cron from 'node-cron';
import Ticket from '../models/Ticket.js';
import Notification from '../models/Notification.js';
import { nextPublicId } from '../utils/http.js';
import { writeAIAudit } from '../ai/aiAuditLogger.js';
import { predictSlaRisk } from '../ai/slaRiskPredictor.js';

export async function runSlaCheck() {
  const openTickets = await Ticket.find({
    status: { $nin: ['Resolved', 'Closed'] },
  });

  if (!openTickets.length) return { checked: 0, escalated: 0, notified: 0 };

  let escalatedCount = 0;
  let notifiedCount = 0;

  for (const ticket of openTickets) {
    let modified = false;
    const now = Date.now();
    const dueDate = ticket.slaDueDate ? new Date(ticket.slaDueDate).getTime() : null;
    const hoursRemaining = dueDate ? (dueDate - now) / 3600000 : null;

    // 1. Check if deadline breached
    if (dueDate && hoursRemaining !== null && hoursRemaining <= 0) {
      if (!ticket.slaPrediction || ticket.slaPrediction.riskLevel !== 'Critical') {
        ticket.slaPrediction = {
          riskLevel: 'Critical',
          riskScore: 1.0,
          reason: `SLA deadline expired ${Math.abs(Math.round(hoursRemaining))} hour(s) ago.`,
          predictedAt: new Date(),
        };
        modified = true;
      }
      if (!ticket.escalationFlag) {
        ticket.escalationFlag = true;
        ticket.priority = 'Critical';
        ticket.timeline.push({
          message: 'Automatic SLA breach escalation triggered by monitor',
          actor: 'SLA_MONITOR',
        });
        escalatedCount += 1;
        modified = true;

        // Create alert notification for administrators
        const notifId = await nextPublicId(Notification, 'notificationId', 'N');
        await Notification.create({
          notificationId: notifId,
          role: 'MAIN_ADMIN',
          title: `SLA Breached: Ticket ${ticket.ticketId}`,
          message: `Ticket ${ticket.ticketId} (${ticket.title}) in Block ${ticket.blockId} has passed its SLA deadline.`,
          type: 'SLA_ALERT',
          entityType: 'Ticket',
          entityId: ticket.ticketId,
        });
        notifiedCount += 1;
      }
    }
    // 2. Approaching deadline within 4 hours
    else if (dueDate && hoursRemaining !== null && hoursRemaining <= 4) {
      if (!ticket.assignedTechnicianId && !ticket.escalationFlag) {
        // Critical unassigned ticket approaching deadline -> escalate
        ticket.escalationFlag = true;
        ticket.priority = 'Critical';
        ticket.timeline.push({
          message: `Approaching deadline in ${Math.max(1, Math.round(hoursRemaining))}h with no technician assigned`,
          actor: 'SLA_MONITOR',
        });
        escalatedCount += 1;
        modified = true;

        const notifId = await nextPublicId(Notification, 'notificationId', 'N');
        await Notification.create({
          notificationId: notifId,
          role: 'MAIN_ADMIN',
          title: `Urgent SLA Warning: ${ticket.ticketId}`,
          message: `Ticket ${ticket.ticketId} is unassigned and due in ${Math.max(1, Math.round(hoursRemaining))}h.`,
          type: 'SLA_ALERT',
          entityType: 'Ticket',
          entityId: ticket.ticketId,
        });
        notifiedCount += 1;
      }

      // Refresh risk prediction
      const prediction = await predictSlaRisk(ticket);
      ticket.slaPrediction = prediction;
      modified = true;
    }

    if (modified) {
      await ticket.save();
    }
  }

  if (escalatedCount > 0) {
    await writeAIAudit({
      action: 'SLA_MONITOR_ESCALATIONS_TRIGGERED',
      entityType: 'SLA',
      entityId: 'SYSTEM',
      actorId: 'SLA_MONITOR',
      message: `Proactive SLA check escalated ${escalatedCount} ticket(s) and notified admins.`,
    });
  }

  return { checked: openTickets.length, escalated: escalatedCount, notified: notifiedCount };
}

let cronJob = null;

export function startSlaMonitor() {
  const enabled = process.env.SLA_MONITOR_ENABLED !== 'false';
  if (!enabled) {
    console.log('[SLA Monitor] Disabled via SLA_MONITOR_ENABLED');
    return null;
  }

  const intervalMinutes = Math.max(1, Number(process.env.SLA_MONITOR_INTERVAL_MINUTES || 15));
  const cronExpression = `*/${intervalMinutes} * * * *`;

  if (cronJob) cronJob.stop();

  cronJob = cron.schedule(cronExpression, async () => {
    try {
      const res = await runSlaCheck();
      if (res.escalated > 0) {
        console.log(`[SLA Monitor] Checked ${res.checked} tickets, escalated ${res.escalated}, sent ${res.notified} alerts.`);
      }
    } catch (err) {
      console.warn(`[SLA Monitor] Error running periodic SLA check: ${err.message}`);
    }
  });

  console.log(`[SLA Monitor] Started scheduled monitor (every ${intervalMinutes}m).`);
  return cronJob;
}
