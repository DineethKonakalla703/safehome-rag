// Tiny, safe markdown renderer (no innerHTML): paragraphs, lists, tables, bold/italic/code, ticket ids as links.
import { Link } from 'react-router-dom';

function inline(text, keyBase) {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\bTK\d{3,}\b)/g;
  let last = 0;
  let match;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    i += 1;
    const key = `${keyBase}-${i}`;
    if (token.startsWith('**')) parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('`')) parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    else if (token.startsWith('*')) parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    else parts.push(<Link key={key} to={`/tickets/${token}`}>{token}</Link>);
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
const isDivider = (line) => /^\s*\|[\s:|-]+\|\s*$/.test(line);
const isListItem = (line) => /^\s*([-*•]|\d+\.)\s+/.test(line);

export default function Markdown({ text = '' }) {
  const lines = String(text).split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isTableRow(line)) {
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) { rows.push(lines[i]); i += 1; }
      const cells = rows.filter((r) => !isDivider(r)).map((r) => r.trim().slice(1, -1).split('|').map((c) => c.trim()));
      const [head = [], ...body] = cells;
      blocks.push(
        <div className="copilot-table-wrap" key={`t${i}`}>
          <table>
            <thead><tr>{head.map((c, j) => <th key={j}>{inline(c, `h${i}-${j}`)}</th>)}</tr></thead>
            <tbody>{body.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{inline(c, `c${i}-${k}-${j}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (isListItem(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && isListItem(lines[i])) { items.push(lines[i].replace(/^\s*([-*•]|\d+\.)\s+/, '')); i += 1; }
      const Tag = ordered ? 'ol' : 'ul';
      blocks.push(<Tag key={`l${i}`}>{items.map((item, j) => <li key={j}>{inline(item, `l${i}-${j}`)}</li>)}</Tag>);
      continue;
    }
    if (/^#{1,4}\s+/.test(line)) { blocks.push(<p className="copilot-heading" key={`h${i}`}>{inline(line.replace(/^#+\s+/, ''), `hd${i}`)}</p>); i += 1; continue; }
    if (line.trim() === '' || /^-{3,}$/.test(line.trim())) { i += 1; continue; }
    blocks.push(<p key={`p${i}`}>{inline(line, `p${i}`)}</p>);
    i += 1;
  }
  return <div className="copilot-md">{blocks}</div>;
}
