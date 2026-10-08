import { CheckCircle2, Download, ExternalLink, Eye, Wrench, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { amenityApi, bookingApi } from '../api/amenityApi';
import { apartmentApi, blockApi, communityApi } from '../api/communityApi';
import { documentApi } from '../api/documentApi';
import { inventoryApi } from '../api/inventoryApi';
import { noticeApi } from '../api/noticeApi';
import { parkingApi, vehicleApi } from '../api/parkingApi';
import { getAuditLogs, getReports } from '../api/reportApi';
import { residentApi } from '../api/residentApi';
import { getUsers } from '../api/userApi';
import { visitorApi } from '../api/visitorApi';
import { getWorkOrders, updateWorkOrderStatus } from '../api/workOrderApi';
import DataState from '../components/DataState';
import PageHeader from '../components/PageHeader';
import ResourceManager from '../components/ResourceManager';
import StatusBadge from '../components/StatusBadge';
import { getCurrentUser } from '../utils/auth';

const req = (name, label, type = 'text') => ({ name, label, type, required: true });
const field = (name, label, type = 'text') => ({ name, label, type });
const col = (key, label, badge = false) => ({ key, label, badge });
const current = () => getCurrentUser();
const isMain = () => current().role === 'MAIN_ADMIN';
const isManager = () => ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'].includes(current().role);

export const CommunitiesPage = () => <ResourceManager title="Community Management" subtitle="Maintain residential communities and their addresses." api={communityApi} idKey="communityId" columns={[col('communityId','ID'),col('name','Community'),col('address','Address')]} fields={[req('name','Community name'),req('address','Address')]} canCreate={isMain()} canEdit={isMain()} canDelete={isMain()}/>;
export const BlocksPage = () => <ResourceManager title="Block Management" subtitle="Configure blocks within each community." api={blockApi} idKey="blockId" columns={[col('blockId','ID'),col('name','Block'),col('communityId','Community')]} fields={[req('name','Block name'),req('communityId','Community ID')]} canCreate={isMain()} canEdit={isMain()} canDelete={isMain()}/>;
export const ApartmentsPage = () => <ResourceManager title="Apartment Management" subtitle="Manage unit occupancy and maintenance status." api={apartmentApi} idKey="apartmentId" columns={[col('apartmentId','ID'),col('number','Unit'),col('blockId','Block'),col('status','Status',true)]} fields={[req('number','Apartment number'),req('blockId','Block ID'),req('communityId','Community ID'),{...req('status','Status','select'),options:['Occupied','Vacant','Maintenance']}]} canCreate={isMain()} canEdit={isMain()} canDelete={isMain()}/>;
export const ResidentsPage = () => <ResourceManager title="Resident Management" subtitle="Owners and tenants, scoped to your permitted blocks." api={residentApi} idKey="residentId" columns={[col('residentId','ID'),col('name','Resident'),col('apartmentId','Apartment'),col('blockId','Block'),col('ownerOrTenant','Type'),col('status','Status',true)]} fields={[req('name','Full name'),req('email','Email','email'),field('phone','Phone'),req('apartmentId','Apartment ID'),req('blockId','Block ID'),req('communityId','Community ID'),{...field('ownerOrTenant','Occupancy','select'),options:['Owner','Tenant']},field('familyMembers','Family members','number'),field('emergencyContact','Emergency contact'),field('moveInDate','Move-in date','date'),field('moveOutDate','Move-out date','date'),{...field('status','Status','select'),options:['Active','Inactive']}]} canCreate={isManager()} canEdit={isManager()} canDelete={isManager()}/>;

export function VisitorsPage({ security = false }) { const user = current(); const canManage = isManager() || user.role === 'SECURITY'; return <ResourceManager title={security ? 'Security Dashboard' : 'Visitor Management'} subtitle={security ? 'Register arrivals, approve access and record visitor exits.' : 'Manage visitor requests within your access scope.'} api={visitorApi} idKey="visitorId" columns={[col('visitorId','ID'),col('name','Visitor'),col('apartmentId','Apartment'),col('purpose','Purpose'),col('status','Status',true)]} fields={[req('name','Visitor name'),req('phone','Phone'),req('purpose','Purpose'),req('residentId','Resident ID'),req('apartmentId','Apartment ID'),req('blockId','Block ID')]} defaults={{ residentId:user.role==='RESIDENT'?user.id:'', apartmentId:user.apartmentId||'', blockId:user.blockId||'' }} canCreate canEdit={canManage} canDelete={canManage} actions={[{ label:'Approve', show:(r)=>r.status==='Pending', run:(r)=>visitorApi.approve(r.visitorId) },{ label:'Check out', show:(r)=>['Approved','Inside'].includes(r.status), run:(r)=>visitorApi.exit(r.visitorId) }]}/>; }
export const VehiclesPage = () => { const user=current(); return <ResourceManager title="Vehicle Management" subtitle="Register resident vehicles and view assigned parking." api={vehicleApi} idKey="vehicleId" columns={[col('vehicleId','ID'),col('vehicleNumber','Registration'),col('vehicleType','Type'),col('parkingSlotId','Parking slot')]} fields={[req('residentId','Resident ID'),req('apartmentId','Apartment ID'),req('blockId','Block ID'),req('vehicleNumber','Vehicle number'),{...field('vehicleType','Vehicle type','select'),options:['Car','Bike','Other']}]} defaults={{residentId:user.id,apartmentId:user.apartmentId||'',blockId:user.blockId||''}} canCreate canEdit={isManager()} canDelete={isManager()}/>; };
export const ParkingPage = () => <ResourceManager title="Parking Management" subtitle="Track slot availability and assign registered vehicles." api={parkingApi} idKey="slotId" columns={[col('slotId','ID'),col('slotNumber','Slot'),col('blockId','Block'),col('status','Status',true),col('assignedTo','Vehicle')]} fields={[req('blockId','Block ID'),req('slotNumber','Slot number'),{...field('status','Status','select'),options:['Available','Assigned','Maintenance']}]} canCreate={isManager()} canEdit={isManager()} canDelete={isManager()} actions={isManager()?[{label:'Assign vehicle',show:(r)=>r.status!=='Maintenance',run:(r)=>{const id=window.prompt('Vehicle ID to assign');return id?parkingApi.assign(r.slotId,id):Promise.resolve();}}]:[]}/>;
export const AmenitiesPage = () => <ResourceManager title="Amenities" subtitle="Browse and manage community facilities." api={amenityApi} idKey="amenityId" columns={[col('amenityId','ID'),col('name','Amenity'),col('location','Location'),col('charge','Charge'),col('availability','Availability',true)]} fields={[req('name','Name'),req('location','Location'),field('charge','Charge','number'),field('availability','Availability','checkbox')]} defaults={{availability:true}} canCreate={isMain()||current().role==='FACILITY_MANAGER'} canEdit={isMain()||current().role==='FACILITY_MANAGER'} canDelete={isMain()||current().role==='FACILITY_MANAGER'}/>;
export const BookingsPage = () => { const user=current(); return <ResourceManager title="Amenity Bookings" subtitle="Reserve facilities and review booking approvals." api={bookingApi} idKey="bookingId" columns={[col('bookingId','ID'),col('amenityId','Amenity'),col('residentId','Resident'),col('date','Date'),col('timeSlot','Time'),col('status','Status',true)]} fields={[req('amenityId','Amenity ID'),req('residentId','Resident ID'),req('blockId','Block ID'),req('date','Booking date','date'),req('timeSlot','Time slot'),field('charge','Charge','number')]} defaults={{residentId:user.id,blockId:user.blockId||''}} canCreate canEdit={isManager()} canDelete={isManager()} actions={isManager()?[{label:'Approve',show:(r)=>r.status==='Pending',run:(r)=>bookingApi.setStatus(r.bookingId,'Approved')},{label:'Reject',show:(r)=>r.status==='Pending',run:(r)=>bookingApi.setStatus(r.bookingId,'Rejected')}]:[]}/>; };
export const NoticesPage = () => { const manage=['MAIN_ADMIN','BLOCK_SUB_ADMIN'].includes(current().role); return <ResourceManager title="Notices & Announcements" subtitle="Community and block-level communication in one place." api={noticeApi} idKey="noticeId" columns={[col('noticeId','ID'),col('title','Title'),col('targetType','Audience'),col('blockId','Block')]} fields={[req('title','Title'),req('message','Message','textarea'),{...req('targetType','Audience','select'),options:['Community','Block']},field('blockId','Block ID')]} canCreate={manage} canEdit={manage} canDelete={manage}/>; };
export const DocumentsPage = () => { const user=current(); const manage=['MAIN_ADMIN','BLOCK_SUB_ADMIN'].includes(user.role); return <ResourceManager title="Documents" subtitle="Metadata catalogue for policies, forms, receipts and records." api={documentApi} idKey="documentId" columns={[col('documentId','ID'),col('title','Title'),col('type','Type'),col('relatedEntityType','Related to'),col('fileUrl','URL')]} fields={[req('title','Title'),req('type','Document type'),req('fileUrl','File URL','url'),req('relatedEntityType','Related entity type'),req('relatedEntityId','Related entity ID'),field('blockId','Block ID'),req('uploadedBy','Uploaded by')]} defaults={{uploadedBy:user.id,blockId:user.blockId||''}} canCreate={manage} canEdit={manage} canDelete={manage}/>; };
export const InventoryPage = () => { const manage=isMain()||current().role==='FACILITY_MANAGER'; return <ResourceManager title="Inventory" subtitle="Maintenance stock, reorder thresholds and accountable usage." api={inventoryApi} idKey="itemId" columns={[col('itemId','ID'),col('name','Item'),col('category','Category'),col('quantity','Stock'),col('minimumStock','Minimum'),col('unit','Unit')]} fields={[req('name','Item name'),req('category','Category'),field('quantity','Quantity','number'),field('minimumStock','Minimum stock','number'),req('unit','Unit'),req('location','Location')]} canCreate={manage} canEdit={manage} canDelete={manage} actions={[{label:'Use stock',run:(r)=>{const quantity=window.prompt(`Quantity to use (${r.quantity} available)`);return quantity?inventoryApi.use(r.itemId,Number(quantity)):Promise.resolve();}}]}/>; };

function AsyncTable({ loader, title, subtitle, children }) { const [state,setState]=useState({data:null,loading:true,error:null}); const load=()=>{setState({data:null,loading:true,error:null});loader().then(data=>setState({data,loading:false,error:null})).catch(error=>setState({data:null,loading:false,error}));}; useEffect(load,[]); return <><PageHeader eyebrow="SafeHome operations" title={title} subtitle={subtitle}/><DataState loading={state.loading} error={state.error} onRetry={load}/>{state.data&&children(state.data,load)}</>; }
export function WorkOrdersPage() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <AsyncTable loader={getWorkOrders} title="Work Orders" subtitle="Assigned maintenance work and technician completion tracking.">
        {(orders, load) => (
          <section className="content-card resource-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Ticket</th>
                    <th>Technician</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Completion note</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((row) => (
                    <tr key={row.workOrderId}>
                      <td><strong className="ticket-id">{row.workOrderId}</strong></td>
                      <td>
                        <Link to={`/tickets/${row.ticketId}`} className="ticket-link" title="Open ticket case file">
                          {row.ticketId}
                        </Link>
                      </td>
                      <td>{row.technicianId}</td>
                      <td>{row.title}</td>
                      <td><StatusBadge>{row.status}</StatusBadge></td>
                      <td>{row.completionNote || '—'}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="table-action"
                            onClick={() => setSelected(row)}
                            title="View full work order details"
                          >
                            <Eye size={14} /> View details
                          </button>
                          <button
                            className="table-action"
                            onClick={async () => {
                              const note = window.prompt('Completion/progress note', row.completionNote || '') || '';
                              await updateWorkOrderStatus(row.workOrderId, row.status === 'Completed' ? 'In Progress' : 'Completed', note);
                              load();
                            }}
                          >
                            <Wrench size={14} /> {row.status === 'Completed' ? 'Reopen work' : 'Complete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </AsyncTable>
      {selected && (
        <div className="modal-backdrop">
          <section className="resource-modal">
            <div className="modal-head">
              <div>
                <span className="section-kicker">Work order details</span>
                <h2>{selected.workOrderId}</h2>
              </div>
              <button className="icon-action" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>
            <dl className="info-grid">
              <div>
                <dt>Ticket reference</dt>
                <dd>
                  <Link to={`/tickets/${selected.ticketId}`} className="ticket-link">
                    <strong>{selected.ticketId}</strong> &rarr;
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Work title</dt>
                <dd>{selected.title}</dd>
              </div>
              <div>
                <dt>Assigned technician</dt>
                <dd>{selected.technicianId}</dd>
              </div>
              <div>
                <dt>Location / Block</dt>
                <dd>{selected.apartmentId ? `${selected.apartmentId} · ` : ''}{selected.blockId || 'Community'}</dd>
              </div>
              {selected.category && (
                <div>
                  <dt>Category</dt>
                  <dd>{selected.category}</dd>
                </div>
              )}
              {selected.severity && (
                <div>
                  <dt>Severity / Risk</dt>
                  <dd>
                    {selected.severity}
                    {selected.safetyRisk && <span className="risk-indicator"> (Safety Risk)</span>}
                  </dd>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <dt>Complaint description</dt>
                <dd className="detail-description">{selected.description || 'No additional description provided.'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd><StatusBadge>{selected.status}</StatusBadge></dd>
              </div>
              <div>
                <dt>Scheduled at</dt>
                <dd>{selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString() : 'Immediate dispatch'}</dd>
              </div>
              {selected.completedAt && (
                <div>
                  <dt>Completed at</dt>
                  <dd>{new Date(selected.completedAt).toLocaleString()}</dd>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <dt>Completion note</dt>
                <dd>{selected.completionNote || 'No completion notes recorded yet.'}</dd>
              </div>
            </dl>
            <div className="modal-actions">
              <Link
                to={`/tickets/${selected.ticketId}`}
                className="primary-button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={15} /> Open Full Ticket Case File
              </Link>
              <button className="secondary-button" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
export function TechniciansPage() { return <AsyncTable loader={getUsers} title="Technicians" subtitle="Technician directory and operational assignments.">{(users)=><section className="content-card resource-card"><div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Block</th><th>Status</th></tr></thead><tbody>{users.filter((u)=>u.role==='TECHNICIAN').map((u)=><tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.blockId||'All blocks'}</td><td><StatusBadge>{u.status||'Active'}</StatusBadge></td></tr>)}</tbody></table></div></section>}</AsyncTable>; }
const flattenReports=(reports)=>Object.entries(reports).flatMap(([report,data])=>Object.entries(data).flatMap(([metric,value])=>Array.isArray(value)?value.map((v)=>({report,metric,label:v._id??'Unspecified',value:v.count})): [{report,metric,label:metric,value}]));
export function ReportsPage() { return <AsyncTable loader={getReports} title="Reports & Analytics" subtitle="Operational summaries generated from live scoped records.">{(reports)=>{const rows=flattenReports(reports);const exportCsv=()=>{const csv=['Report,Metric,Label,Value',...rows.map((r)=>[r.report,r.metric,r.label,r.value].map((v)=>`"${String(v).replaceAll('"','""')}"`).join(','))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='safehome-reports.csv';a.click();URL.revokeObjectURL(url);};return <section className="content-card resource-card"><div className="table-toolbar"><button className="secondary-button" onClick={exportCsv}><Download size={16}/> Export CSV</button></div><div className="table-wrap"><table><thead><tr><th>Report</th><th>Metric</th><th>Group</th><th>Value</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{r.report}</td><td>{r.metric}</td><td>{r.label}</td><td>{r.value}</td></tr>)}</tbody></table></div></section>;}}</AsyncTable>; }
export function AuditLogsPage() { return <AsyncTable loader={getAuditLogs} title="Audit Logs" subtitle="Immutable operational history for accountability and review.">{(logs)=><section className="content-card resource-card"><div className="table-wrap"><table><thead><tr><th>Timestamp</th><th>Action</th><th>Actor</th><th>Entity</th><th>Message</th></tr></thead><tbody>{logs.map((log)=><tr key={log._id}><td>{new Date(log.createdAt).toLocaleString()}</td><td><StatusBadge>{log.action}</StatusBadge></td><td>{log.actorId}</td><td>{log.entityType} · {log.entityId}</td><td>{log.message}</td></tr>)}</tbody></table></div></section>}</AsyncTable>; }
export const SecurityDashboard = () => <VisitorsPage security/>;
