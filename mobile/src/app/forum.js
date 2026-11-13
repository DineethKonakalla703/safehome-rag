import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, Chips, Empty, ErrorNote, Field, Loading, Row, Screen, Sheet, T, ago, inr, tap, useResource } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, fonts } from '../theme';

const KINDS = ['Discussion', 'Buy / Sell', 'Lost & Found', 'Recommendation', 'Help Needed'];

export default function Forum() {
  const { user } = useAuth();
  const { data, loading, error, reload, refreshing } = useResource(() => api('/forum'));
  const [kind, setKind] = useState('All');
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [err, setErr] = useState(null);
  const posts = (data || []).filter((p) => kind === 'All' || p.kind === kind).sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt) - new Date(a.createdAt));

  const like = async (p) => { tap(); try { await api(`/forum/${p.postId}/like`, { method: 'POST' }); await reload(); } catch (e) { setErr(e); } };

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={{ marginTop: 6 }} />
      {composing ? <Compose onCancel={() => setComposing(false)} onDone={() => { setComposing(false); reload(); }} /> : <Button title="Start a post" icon="edit-3" onPress={() => setComposing(true)} style={{ marginBottom: 14 }} />}
      <Chips options={['All', ...KINDS]} value={kind} onChange={setKind} />
      <ErrorNote error={err || error} onRetry={reload} />
      {loading ? <Loading /> : !posts.length ? <Empty icon="message-square" title="Quiet in here" message="Start a conversation with your neighbours." /> : posts.map((p) => (
        <Card key={p.postId} style={{ marginBottom: 10 }} accent={p.pinned ? colors.brass : undefined}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <Badge tone={p.kind === 'Buy / Sell' ? 'brass' : p.kind === 'Lost & Found' || p.kind === 'Help Needed' ? 'warning' : 'neutral'}>{p.kind}</Badge>
            {p.status === 'Closed' ? <Badge tone="neutral">Closed</Badge> : p.pinned ? <Badge tone="brass">Pinned</Badge> : null}
          </Row>
          <Pressable onPress={() => setOpenId(openId === p.postId ? null : p.postId)}>
            <T.title>{p.title}{p.price ? `  ·  ${inr(p.price)}` : ''}</T.title>
            {p.body ? <T.body style={{ marginTop: 4 }} numberOfLines={openId === p.postId ? undefined : 3}>{p.body}</T.body> : null}
          </Pressable>
          <Row style={{ justifyContent: 'space-between', marginTop: 10 }}>
            <T.muted>{p.authorName}{p.apartmentId ? ` · ${p.apartmentId}` : ''} · {ago(p.createdAt)}</T.muted>
            <Row gap={14}>
              <Pressable onPress={() => like(p)} hitSlop={8}><Row gap={5}><Feather name="heart" size={15} color={p.likedByMe ? colors.sos : colors.faint} /><Text style={styles.count}>{p.likeCount ?? 0}</Text></Row></Pressable>
              <Pressable onPress={() => setOpenId(openId === p.postId ? null : p.postId)} hitSlop={8}><Row gap={5}><Feather name="message-circle" size={15} color={colors.faint} /><Text style={styles.count}>{p.commentCount ?? 0}</Text></Row></Pressable>
            </Row>
          </Row>
          {openId === p.postId ? <Comments post={p} user={user} onChange={reload} /> : null}
        </Card>
      ))}
    </Screen>
  );
}

function Comments({ post, onChange }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try { await api(`/forum/${post.postId}/comments`, { method: 'POST', body: { text: text.trim() } }); setText(''); onChange(); } finally { setBusy(false); }
  };
  return (
    <View style={styles.comments}>
      {post.commentCount > (post.comments || []).length ? <T.muted style={{ marginBottom: 8 }}>Showing the latest {post.comments.length} of {post.commentCount} replies</T.muted> : null}
      {(post.comments || []).map((c) => (
        <View key={c.commentId || c._id} style={{ marginBottom: 10 }}>
          <Text style={styles.cAuthor}>{c.authorName || c.authorId} <Text style={styles.cTime}>· {ago(c.at)}</Text></Text>
          <T.body>{c.text}</T.body>
        </View>
      ))}
      <Row gap={8} style={{ alignItems: 'flex-start' }}>
        <Field value={text} onChangeText={setText} placeholder="Write a reply…" style={{ flex: 1, marginBottom: 0 }} />
        <Button small title="Reply" disabled={!text.trim()} loading={busy} onPress={send} style={{ minHeight: 48 }} />
      </Row>
    </View>
  );
}

function Compose({ onCancel, onDone }) {
  const [form, setForm] = useState({ kind: 'Discussion', title: '', body: '', price: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (form.title.trim().length < 3) return setErr(new Error('Give your post a title.'));
    setBusy(true); setErr(null);
    try { await api('/forum', { method: 'POST', body: { kind: form.kind, title: form.title.trim(), body: form.body.trim(), ...(form.kind === 'Buy / Sell' && form.price ? { price: Number(form.price) } : {}) } }); onDone(); }
    catch (e) { setErr(e); setBusy(false); }
  };
  return (
    <Sheet title="New post">
      <ErrorNote error={err} />
      <Chips options={KINDS} value={form.kind} onChange={set('kind')} />
      <Field label="Title" value={form.title} onChangeText={set('title')} placeholder={form.kind === 'Buy / Sell' ? 'e.g. Study table, barely used' : 'What\'s it about?'} />
      <Field label="Details" value={form.body} onChangeText={set('body')} multiline placeholder="Add anything neighbours should know" />
      {form.kind === 'Buy / Sell' ? <Field label="Price (₹)" value={form.price} onChangeText={set('price')} keyboardType="number-pad" /> : null}
      <Row gap={10}>
        <Button title="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
        <Button title="Post" icon="send" loading={busy} onPress={submit} style={{ flex: 1.4 }} />
      </Row>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  count: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.muted },
  comments: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  cAuthor: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.text, marginBottom: 2 },
  cTime: { fontFamily: fonts.body, color: colors.faint },
});
