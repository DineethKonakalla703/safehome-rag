import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Chips, ErrorNote, Field, Screen, Sheet, T } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const CATEGORIES = ['Plumbing', 'Electrical', 'Lift', 'Carpentry', 'Housekeeping', 'Security', 'Common Area', 'Other'];

export default function NewTicket() {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (form.title.trim().length < 4 || form.description.trim().length < 10) return setError(new Error('Add a short title and a sentence or two describing the issue.'));
    setBusy(true); setError(null);
    try {
      const body = { title: form.title.trim(), description: form.description.trim(), ...(form.category ? { category: form.category } : {}) };
      if (user.role !== 'RESIDENT') Object.assign(body, { residentId: user.userId, apartmentId: user.apartmentId, blockId: user.blockId, communityId: user.communityId });
      const t = await api('/tickets', { method: 'POST', body });
      router.replace(`/tickets/${t.ticketId}`);
    } catch (e) { setError(e); setBusy(false); }
  };

  return (
    <Screen>
      <T.muted style={{ marginBottom: 16, marginTop: 6 }}>
        {user.apartmentId ? `For apartment ${user.apartmentId} · ${user.blockId}. ` : ''}The assistant classifies severity and routes it to the right technician.
      </T.muted>
      <ErrorNote error={error} />
      <Sheet>
        <Field label="What's wrong?" value={form.title} onChangeText={set('title')} placeholder="e.g. Kitchen sink leaking" maxLength={120} />
        <Field label="Details" value={form.description} onChangeText={set('description')} placeholder="Where is it, since when, anything that makes it worse…" multiline maxLength={2000} />
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 12.5, color: '#4D5464', marginBottom: 8 }}>Category (optional)</Text>
        <Chips options={CATEGORIES} value={form.category} onChange={(v) => set('category')(form.category === v ? '' : v)} scroll={false} />
        <Button title="Submit request" icon="send" onPress={submit} loading={busy} />
      </Sheet>
    </Screen>
  );
}
