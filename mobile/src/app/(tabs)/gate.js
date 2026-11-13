import { useState } from 'react';
import { Chips, PageTitle, Screen } from '../../components/ui';
import { ParcelsPanel, VisitorsPanel } from '../../components/gate';
import { useAuth } from '../../lib/auth';

export default function Gate() {
  const { user } = useAuth();
  const [tab, setTab] = useState('visitors');
  const [refreshKey, setRefreshKey] = useState(0);
  const security = user.role === 'SECURITY';
  return (
    <Screen refreshing={false} onRefresh={() => setRefreshKey((k) => k + 1)}
      header={<PageTitle eyebrow={security ? 'Main gate' : 'Gate & deliveries'} title={security ? 'Gate desk' : 'Visitors'} subtitle={security ? 'Verify passes, log entries and hand over parcels.' : 'Invite guests and collect your deliveries.'} />}>
      <Chips options={[{ value: 'visitors', label: 'Visitors' }, { value: 'parcels', label: 'Parcels' }]} value={tab} onChange={setTab} />
      {tab === 'visitors' ? <VisitorsPanel key={`v${refreshKey}`} user={user} /> : <ParcelsPanel key={`p${refreshKey}`} user={user} />}
    </Screen>
  );
}
