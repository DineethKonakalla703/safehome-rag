import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

// Minimal markdown for Copilot replies: headings, bullets, quotes, rules, **bold**, and tables
// (rendered as stacked rows, since wide tables don't fit a phone screen).
function Inline({ text, style }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <Text key={i} style={styles.bold}>{p.slice(2, -2)}</Text>
        : p.startsWith('`') && p.endsWith('`') ? <Text key={i} style={styles.code}>{p.slice(1, -1)}</Text>
          : p))}
    </Text>
  );
}

const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function Markdown({ text }) {
  const lines = String(text || '').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { out.push({ type: 'gap' }); continue; }
    if (/^(-{2,}|\*{3,}|_{3,})$/.test(line)) { out.push({ type: 'rule' }); continue; }
    if (line.startsWith('|')) {
      const block = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { block.push(lines[i].trim()); i += 1; }
      i -= 1;
      const rows = block.map(cells).filter((row) => !row.every((c) => /^:?-+:?$/.test(c)));
      const [head, ...body] = rows;
      out.push({ type: 'table', head, body });
      continue;
    }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) { out.push({ type: 'h', text: h[1] }); continue; }
    const b = line.match(/^([-*•]|\d+[.)])\s+(.*)$/);
    if (b) { out.push({ type: 'li', marker: /\d/.test(b[1]) ? b[1] : '•', text: b[2] }); continue; }
    if (line.startsWith('>')) { out.push({ type: 'quote', text: line.replace(/^>\s?/, '') }); continue; }
    out.push({ type: 'p', text: line });
  }

  return (
    <View>
      {out.map((n, i) => {
        if (n.type === 'gap') return <View key={i} style={{ height: 6 }} />;
        if (n.type === 'rule') return <View key={i} style={styles.rule} />;
        if (n.type === 'h') return <Inline key={i} text={n.text} style={styles.h} />;
        if (n.type === 'li') return <View key={i} style={styles.li}><Text style={styles.marker}>{n.marker}</Text><Inline text={n.text} style={[styles.p, { flex: 1 }]} /></View>;
        if (n.type === 'quote') return <View key={i} style={styles.quote}><Inline text={n.text} style={styles.p} /></View>;
        if (n.type === 'table') {
          return (
            <View key={i} style={styles.table}>
              {n.body.map((row, r) => (
                <View key={r} style={[styles.tRow, r < n.body.length - 1 && styles.tDivider]}>
                  {row.map((c, ci) => (c ? (
                    <Text key={ci} style={styles.tCell}>
                      {n.head?.[ci] ? <Text style={styles.tKey}>{n.head[ci]}  </Text> : null}
                      <Inline text={c} style={ci === 0 ? styles.tFirst : styles.tVal} />
                    </Text>
                  ) : null))}
                </View>
              ))}
            </View>
          );
        }
        return <Inline key={i} text={n.text} style={styles.p} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  p: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.text },
  bold: { fontFamily: fonts.bold, color: colors.ink },
  code: { fontFamily: fonts.bold, color: colors.brassDeep },
  h: { fontFamily: fonts.display, fontSize: 17, color: colors.ink, marginTop: 6, marginBottom: 2 },
  li: { flexDirection: 'row', gap: 8, paddingLeft: 2 },
  marker: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 23, color: colors.brass, minWidth: 12 },
  quote: { borderLeftWidth: 3, borderLeftColor: colors.brassLight, paddingLeft: 10, marginVertical: 4, backgroundColor: colors.brassSoft, paddingVertical: 6, borderRadius: 4 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginVertical: 10 },
  table: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, backgroundColor: colors.surface, marginVertical: 6, overflow: 'hidden' },
  tRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  tDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tCell: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19 },
  tKey: { fontFamily: fonts.heavy, fontSize: 10, letterSpacing: 1, color: colors.faint, textTransform: 'uppercase' },
  tFirst: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  tVal: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textSoft },
});
