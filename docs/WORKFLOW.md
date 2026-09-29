# Workflow

## Resident complaint

1. Resident One opens Create Complaint.
2. The form combines the resident’s stored apartment and block with the supplied title and description.
3. The rule engine classifies the text and records its output with the ticket.
4. The ticket is saved in localStorage and its details page opens.

## Role-based access

- Main Admin: all tickets and bills.
- Block Sub Admin: records whose `blockId` matches the admin’s block.
- Resident: records whose `residentId` matches the logged-in resident.
- Technician: tickets assigned to the technician profile linked to that user.

This is a UI prototype of access rules, not production authorization.

## Ticket status flow

`New → Assigned → In Progress → Resolved → Closed`

Main Admin and Block Sub Admin can assign any seeded technician and select any status. Every action adds a timestamped timeline entry. Assigning a technician automatically changes a New ticket to Assigned.

## AI simulation logic

The analysis is deterministic and local:

1. Both “water” and “electrical” → Plumbing + Electrical Risk, High, safety risk.
2. “lift” → Lift Maintenance, High, safety risk.
3. “light” or “bulb” → Electrical, Medium, no safety risk.
4. Any other description → General Maintenance, Low, no safety risk.

The label “AI Simulation Output” makes clear that no AI model or external service is used.

