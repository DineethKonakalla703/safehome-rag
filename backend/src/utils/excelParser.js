import XLSX from 'xlsx';
import { AppError } from './http.js';

export const requiredExcelColumns = ['flat_number', 'floor_number', 'resident_name', 'phone'];
export function parseResidentWorkbook(buffer) {
  const isZip=buffer?.[0]===0x50&&buffer?.[1]===0x4b;const isOle=buffer?.subarray(0,8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));if(!isZip&&!isOle)throw new AppError(400,'Excel file signature is invalid.');
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  if(workbook.SheetNames.length>Number(process.env.MAX_EXCEL_SHEETS||3))throw new AppError(400,'Workbook contains too many sheets.');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };
  for(const [address,cell]of Object.entries(sheet)){if(address.startsWith('!'))continue;if(cell?.f)throw new AppError(400,'Excel formulas are not allowed.');if(String(cell?.v??'').length>10000)throw new AppError(400,'A workbook cell exceeds the maximum allowed length.');}
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }).filter((row) => Object.values(row).some((value) => String(value).trim()));
  if(rows.length>Number(process.env.MAX_EXCEL_ROWS||1000))throw new AppError(400,'Workbook contains too many rows.');
  const normalize = (key) => String(key).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return { headers: rows.length ? Object.keys(rows[0]).map(normalize) : [], rows: rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [normalize(key), String(value).trim()]))) };
}
