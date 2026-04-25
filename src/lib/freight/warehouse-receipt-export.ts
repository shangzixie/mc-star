import { format } from 'date-fns';
import { formatScaledInt } from './math';

export const WAREHOUSE_RECEIPT_EXPORT_HEADERS = [
  '备注',
  '运输类型',
  '报关类型',
  '工作号',
  '客户',
  '货物品名',
  '包装件数',
  '包装类型',
  '合计体积',
  '合计毛重',
  '目的港/目的地(MBL)',
  '备忘',
  '发货人',
  '内部备注',
  '入仓时间',
  'HBL号',
  '库房名称',
] as const;

export type WarehouseReceiptExportHeader =
  (typeof WAREHOUSE_RECEIPT_EXPORT_HEADERS)[number];

export type WarehouseReceiptExportRow = Record<
  WarehouseReceiptExportHeader,
  string | number
>;

export type WarehouseReceiptExportItemInput = {
  commodityName: string | null;
  currentQty: number;
  unit: string | null;
  weightPerUnit: string | number | null;
  lengthCm: string | number | null;
  widthCm: string | number | null;
  heightCm: string | number | null;
};

export type WarehouseReceiptExportInput = {
  receiptNo: string;
  remarks: string | null;
  internalRemarks: string | null;
  transportType: string | null;
  customsDeclarationType: string | null;
  inboundTime: Date | string | null;
  customerName: string | null;
  shipperName: string | null;
  warehouseName: string | null;
  hblNo: string | null;
  mblPortOfDestinationAddress: string | null;
  mblPortOfDestinationNameCn: string | null;
  mblPortOfDestinationNameEn: string | null;
  items: WarehouseReceiptExportItemInput[];
};

const TRANSPORT_TYPE_LABELS: Record<string, string> = {
  SEA_FCL: '海运整柜',
  AIR_FREIGHT: '航空货运',
  SEA_LCL: '海运拼箱',
  DOMESTIC_TRANSPORT: '内贸运输',
  WAREHOUSING: '仓储服务',
  ROAD_FTL: '陆路运输（整车）',
  ROAD_LTL: '陆路运输（拼车）',
  EXPRESS_LINEHAUL: '快递/专线',
  FBA_SEA: 'FBA海运',
  FBA_AIR: 'FBA空运',
  FBA_RAIL: 'FBA铁路',
  BULK_CARGO: '散杂货船',
  RAIL_FREIGHT: '铁路运输',
};

const CUSTOMS_DECLARATION_TYPE_LABELS: Record<string, string> = {
  NO_DECLARATION: '不报关',
  BUY_ORDER: '买单',
  FORMAL_DECLARATION: '正报',
};

function text(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function labelFor(value: string | null, labels: Record<string, string>) {
  if (!value) return '';
  return labels[value] ?? value;
}

function numberValue(value: string | number | null) {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function joinUnique(values: Array<string | null>) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = text(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result.join('; ');
}

function formatInboundTime(value: Date | string | null) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'yyyy-MM-dd HH:mm');
}

function ceilNumberToDecimals(value: number, decimals: number) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.ceil((value - Number.EPSILON) * factor) / factor;
}

function getMblDestination(receipt: WarehouseReceiptExportInput) {
  return (
    text(receipt.mblPortOfDestinationAddress) ||
    text(receipt.mblPortOfDestinationNameCn) ||
    text(receipt.mblPortOfDestinationNameEn)
  );
}

function calculateTotals(items: WarehouseReceiptExportItemInput[]) {
  let pieces = 0;
  let totalWeight = 0;
  let totalVolumeScaled = 0;

  for (const item of items) {
    const qty = Math.max(0, item.currentQty);
    pieces += qty;
    totalWeight += numberValue(item.weightPerUnit) * qty;

    const unitVolumeRaw =
      (numberValue(item.lengthCm) *
        numberValue(item.widthCm) *
        numberValue(item.heightCm)) /
      1_000_000;
    totalVolumeScaled +=
      Math.round(ceilNumberToDecimals(unitVolumeRaw, 2) * 100) * qty;
  }

  return {
    pieces,
    totalWeight: ceilNumberToDecimals(totalWeight, 2).toFixed(2),
    totalVolume: formatScaledInt(totalVolumeScaled, 2),
  };
}

export function buildWarehouseReceiptExportRows(
  receipts: WarehouseReceiptExportInput[]
): WarehouseReceiptExportRow[] {
  return receipts.map((receipt) => {
    const totals = calculateTotals(receipt.items);
    return {
      备注: text(receipt.remarks),
      运输类型: labelFor(receipt.transportType, TRANSPORT_TYPE_LABELS),
      报关类型: labelFor(
        receipt.customsDeclarationType,
        CUSTOMS_DECLARATION_TYPE_LABELS
      ),
      工作号: receipt.receiptNo,
      客户: text(receipt.customerName),
      货物品名: joinUnique(receipt.items.map((item) => item.commodityName)),
      包装件数: totals.pieces,
      包装类型: joinUnique(receipt.items.map((item) => item.unit)),
      合计体积: totals.totalVolume,
      合计毛重: totals.totalWeight,
      '目的港/目的地(MBL)': getMblDestination(receipt),
      备忘: '',
      发货人: text(receipt.shipperName),
      内部备注: text(receipt.internalRemarks),
      入仓时间: formatInboundTime(receipt.inboundTime),
      HBL号: text(receipt.hblNo),
      库房名称: text(receipt.warehouseName),
    };
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getColumnName(index: number) {
  let value = index + 1;
  let name = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function createCellXml(
  value: string | number,
  rowIndex: number,
  colIndex: number
) {
  const ref = `${getColumnName(colIndex)}${rowIndex}`;
  if (typeof value === 'number') {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function createSheetXml(rows: WarehouseReceiptExportRow[]) {
  const allRows: Array<Array<string | number>> = [
    [...WAREHOUSE_RECEIPT_EXPORT_HEADERS],
    ...rows.map((row) =>
      WAREHOUSE_RECEIPT_EXPORT_HEADERS.map((header) => row[header])
    ),
  ];

  const sheetRows = allRows
    .map((row, rowIndex) => {
      const excelRowIndex = rowIndex + 1;
      const cells = row
        .map((value, colIndex) => createCellXml(value, excelRowIndex, colIndex))
        .join('');
      return `<row r="${excelRowIndex}">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

const CRC32_TABLE = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

type ZipEntry = {
  name: string;
  content: Buffer;
};

function createZip(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const content = entry.content;
    const crc = crc32(content);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function xmlBuffer(value: string) {
  return Buffer.from(value.trim(), 'utf8');
}

export function createWarehouseReceiptExportWorkbook(
  rows: WarehouseReceiptExportRow[]
) {
  return createZip([
    {
      name: '[Content_Types].xml',
      content:
        xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`),
    },
    {
      name: '_rels/.rels',
      content:
        xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    },
    {
      name: 'xl/workbook.xml',
      content:
        xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="现有库存" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content:
        xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`),
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: xmlBuffer(createSheetXml(rows)),
    },
  ]);
}
