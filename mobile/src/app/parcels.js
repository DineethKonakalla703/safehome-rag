import { ParcelsPanel } from '../components/gate';
import { Screen } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Parcels() {
  const { user } = useAuth();
  return <Screen><ParcelsPanel user={user} /></Screen>;
}
