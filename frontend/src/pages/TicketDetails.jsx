import { ArrowLeft, Bot, CheckCircle2, CreditCard, Home, ShieldAlert, UserRound, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { apartments, blocks, nameFor, technicians, users } from '../data/mockData';
import { getCurrentUser } from '../utils/auth';
import { filterTicketsByUser } from '../utils/filters';
import { createBill, getAllBills, getAllTickets, nextId, updateTicket } from '../utils/storage';

const statuses = ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const now = () => new Date().toLocaleString();

export default function TicketDetails() {
  const { id } = useParams(); const user = getCurrentUser();
  const accessible = filterTicketsByUser(getAllTickets(), user);
  const initial = accessible.find((item) => item.id === id);
  const [ticket, setTicket] = useState(initial);
  const [technicianId, setTechnicianId] = useState(initial?.assignedTechnicianId || '');
  const [status, setStatus] = useState(initial?.status || 'New');
  const [bills, setBills] = useState(getAllBills());
  if (!initial) return <Navigate to="/tickets" replace />;
  const canManage = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(user.role);
  const bill = bills.find((item) => item.ticketId === ticket.id);
  const save = (changes, timelineText) => {
    const next = { ...ticket, ...changes, timeline: [...ticket.timeline, { text: timelineText, at: now() }] };
    updateTicket(next); setTicket(next);
  };
  const assign = () => { const tech = technicians.find((item) => item.id === technicianId); if (!tech) return; save({ assignedTechnicianId: tech.id, status: ticket.status === 'New' ? 'Assigned' : ticket.status }, `Technician assigned: ${tech.name}`); setStatus(ticket.status === 'New' ? 'Assigned' : ticket.status); };
  const updateStatus = () => { if (status !== ticket.status) save({ status }, `Status updated to ${status}`); };
  const generateBill = () => { const record = { id: nextId('BILL', getAllBills()), ticketId: ticket.id, residentId: ticket.residentId, apartmentId: ticket.apartmentId, blockId: ticket.blockId, serviceCharge: 300, partsCharge: 200, totalAmount: 500, paymentStatus: 'Pending', generatedAt: new Date().toISOString().slice(0, 10) }; createBill(record); setBills(getAllBills()); };
  const resident = users.find((item) => item.id === ticket.residentId);
  return <>
    <div className="detail-top"><Link className="back-link" to="/tickets"><ArrowLeft size={17} /> Back to tickets</Link><div className="detail-heading"><div><span className="page-eyebrow">Maintenance case file</span><div className="detail-kicker"><span>{ticket.id}</span><StatusBadge>{ticket.status}</StatusBadge>{ticket.safetyRisk && <StatusBadge value="High Risk">High Risk</StatusBadge>}</div><h1>{ticket.title}</h1><p>Created {ticket.createdAt} · {nameFor(blocks, ticket.blockId)} · {nameFor(apartments, ticket.apartmentId, ticket.apartmentId)}</p></div><div className="case-state"><span>Current stage</span><strong>{ticket.status}</strong></div></div></div>
    {ticket.safetyRisk && <div className="safety-alert"><span><ShieldAlert size={24} /></span><div><strong>Safety Risk Detected — Human approval required</strong><p>{ticket.suggestedAction}</p></div><StatusBadge value="High Risk">Immediate review</StatusBadge></div>}
    <div className="detail-grid"><div className="detail-main">
      <section className="content-card detail-card"><div className="card-title"><Home size={19} /><h2>Complaint details</h2></div><dl className="info-grid"><div><dt>Description</dt><dd>{ticket.description}</dd></div><div><dt>Category</dt><dd>{ticket.category}</dd></div><div><dt>Current status</dt><dd><StatusBadge>{ticket.status}</StatusBadge></dd></div><div><dt>Created date</dt><dd>{ticket.createdAt}</dd></div></dl></section>
      <section className="content-card detail-card ai-card"><div className="ai-card-head"><div className="card-title"><span className="ai-icon"><Bot size={21} /></span><div><span className="eyebrow">AI Simulation Output</span><h2>Rule-based complaint analysis</h2></div></div><span className="simulation-label">Deterministic rules</span></div><div className="analysis-grid"><div><span>Category</span><strong>{ticket.category}</strong></div><div><span>Severity</span><strong><StatusBadge value={ticket.severity === 'High' ? 'High Risk' : ticket.severity}>{ticket.severity}</StatusBadge></strong></div><div><span>Safety Risk</span><strong>{ticket.safetyRisk ? 'Yes — detected' : 'No'}</strong></div><div><span>Human Approval</span><strong>{ticket.humanApprovalRequired ? 'Required' : 'Not required'}</strong></div></div><div className="suggestion"><Bot size={18} /><div><span>Recommended next action</span><p>{ticket.suggestedAction}</p></div></div></section>
      <section className="content-card detail-card"><div className="card-title"><UserRound size={19} /><h2>Resident / apartment context</h2></div><dl className="info-grid"><div><dt>Resident</dt><dd>{resident?.name}</dd></div><div><dt>Contact</dt><dd>{resident?.email}</dd></div><div><dt>Apartment</dt><dd>{nameFor(apartments, ticket.apartmentId, ticket.apartmentId)}</dd></div><div><dt>Assigned block</dt><dd>{nameFor(blocks, ticket.blockId)}</dd></div></dl></section>
      <section className="content-card detail-card"><div className="card-title"><CheckCircle2 size={19} /><h2>Activity timeline</h2></div><ol className="timeline">{[...ticket.timeline].reverse().map((item, index) => <li key={`${item.text}-${index}`}><span></span><div><strong>{item.text}</strong><small>{item.at}</small></div></li>)}</ol></section>
    </div><aside className="detail-side">
      <section className="content-card action-card"><div className="card-title"><Wrench size={19} /><h2>Technician assignment</h2></div><p className="muted">Currently assigned</p><strong className="assigned-name">{nameFor(technicians, ticket.assignedTechnicianId, 'Not assigned')}</strong>{canManage && <><label>Choose technician<select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}><option value="">Select technician</option>{technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.name} — {tech.specialty}</option>)}</select></label><button className="primary-button full" onClick={assign} disabled={!technicianId}>Assign technician</button></>}</section>
      <section className="content-card action-card"><div className="card-title"><CheckCircle2 size={19} /><h2>Status update</h2></div><p className="muted">Move this ticket through the service workflow.</p>{canManage ? <><label>New status<select value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><button className="secondary-button full" onClick={updateStatus} disabled={status === ticket.status}>Update status</button></> : <div className="current-status-panel"><span>Current status</span><StatusBadge>{ticket.status}</StatusBadge></div>}</section>
      <section className="content-card action-card"><div className="card-title"><CreditCard size={19} /><h2>Billing summary</h2></div>{bill ? <div className="bill-summary"><div><span>Bill ID</span><strong>{bill.id}</strong></div><div><span>Service charge</span><strong>₹{bill.serviceCharge}</strong></div><div><span>Parts charge</span><strong>₹{bill.partsCharge}</strong></div><div className="bill-total"><span>Total</span><strong>₹{bill.totalAmount}</strong></div><StatusBadge>{bill.paymentStatus}</StatusBadge></div> : canManage ? <><p className="muted">No bill has been created for this ticket.</p><button className="primary-button full" onClick={generateBill}>Generate Demo Bill</button></> : <p className="muted">A bill will appear here when generated by an administrator.</p>}</section>
    </aside></div>
  </>;
}

