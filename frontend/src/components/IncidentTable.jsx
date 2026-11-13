import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function IncidentTable({ incidents = [] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Incident</th>
            <th>Block</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Related tickets</th>
            <th>Status</th>
            <th>Confidence</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((item) => (
            <tr key={item.incidentId}>
              <td>
                <Link to={`/incidents/${item.incidentId}`} className="incident-title-link">
                  <strong>{item.title}</strong>
                </Link>
                <small className="table-sub">{item.incidentId}</small>
              </td>
              <td>{item.blockId}</td>
              <td>{item.category}</td>
              <td><StatusBadge>{item.severity}</StatusBadge></td>
              <td>
                {item.relatedTickets?.map((id) => (
                  <Link key={id} to={`/tickets/${id}`} className="incident-link">
                    {id}
                  </Link>
                ))}
              </td>
              <td><StatusBadge>{item.status}</StatusBadge></td>
              <td>{item.confidence ? `${Math.round(item.confidence * 100)}%` : '—'}</td>
              <td>{item.aiReason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
