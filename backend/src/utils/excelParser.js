import XLSX from 'xlsx';

export const requiredExcelColumns = ['flat_number', 'floor_number', 'resident_name', 'phone'];
export function parseResidentWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }).filter((row) => Object.values(row).some((value) => String(value).trim()));
  const normalize = (key) => String(key).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return { headers: rows.length ? Object.keys(rows[0]).map(normalize) : [], rows: rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [normalize(key), String(value).trim()]))) };
}
