import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WAREHOUSE_RECEIPT_EXPORT_HEADERS,
  buildWarehouseReceiptExportRows,
  createWarehouseReceiptExportWorkbook,
} from './warehouse-receipt-export';

test('warehouse receipt export headers match the required excel template', () => {
  assert.deepEqual(WAREHOUSE_RECEIPT_EXPORT_HEADERS, [
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
  ]);
});

test('builds one export row per receipt from current inventory quantities', () => {
  const rows = buildWarehouseReceiptExportRows([
    {
      receiptNo: 'JOB-001',
      remarks: '普通备注',
      internalRemarks: '内部备注',
      transportType: 'SEA_FCL',
      customsDeclarationType: 'FORMAL_DECLARATION',
      inboundTime: new Date(2026, 3, 20, 9, 30),
      customerName: '客户A',
      shipperName: '发货人A',
      warehouseName: '一号仓',
      hblNo: 'HBL-001',
      mblPortOfDestinationAddress: '',
      mblPortOfDestinationNameCn: '洛杉矶',
      mblPortOfDestinationNameEn: 'Los Angeles',
      items: [
        {
          commodityName: '鞋子',
          currentQty: 2,
          unit: 'CTN',
          weightPerUnit: '1.234',
          lengthCm: '10',
          widthCm: '10',
          heightCm: '10',
        },
        {
          commodityName: '衣服',
          currentQty: 3,
          unit: 'CTN',
          weightPerUnit: '2',
          lengthCm: '20',
          widthCm: '10',
          heightCm: '10',
        },
      ],
    },
  ]);

  assert.deepEqual(rows, [
    {
      备注: '普通备注',
      运输类型: '海运整柜',
      报关类型: '正报',
      工作号: 'JOB-001',
      客户: '客户A',
      货物品名: '鞋子; 衣服',
      包装件数: 5,
      包装类型: 'CTN',
      合计体积: '0.05',
      合计毛重: '8.47',
      '目的港/目的地(MBL)': '洛杉矶',
      备忘: '',
      发货人: '发货人A',
      内部备注: '内部备注',
      入仓时间: '2026-04-20 09:30',
      HBL号: 'HBL-001',
      库房名称: '一号仓',
    },
  ]);
});

test('prefers MBL destination address and de-duplicates commodity names and units', () => {
  const [row] = buildWarehouseReceiptExportRows([
    {
      receiptNo: 'JOB-002',
      remarks: null,
      internalRemarks: null,
      transportType: 'AIR_FREIGHT',
      customsDeclarationType: 'NO_DECLARATION',
      inboundTime: null,
      customerName: null,
      shipperName: null,
      warehouseName: null,
      hblNo: null,
      mblPortOfDestinationAddress: '123 Destination Address',
      mblPortOfDestinationNameCn: '东京',
      mblPortOfDestinationNameEn: 'Tokyo',
      items: [
        {
          commodityName: '配件',
          currentQty: 1,
          unit: '箱',
          weightPerUnit: '1',
          lengthCm: '100',
          widthCm: '100',
          heightCm: '100',
        },
        {
          commodityName: '配件',
          currentQty: 0,
          unit: '箱',
          weightPerUnit: '9',
          lengthCm: '100',
          widthCm: '100',
          heightCm: '100',
        },
        {
          commodityName: '工具',
          currentQty: 2,
          unit: '托',
          weightPerUnit: '0.333',
          lengthCm: '1',
          widthCm: '1',
          heightCm: '1',
        },
      ],
    },
  ]);

  assert.equal(row['目的港/目的地(MBL)'], '123 Destination Address');
  assert.equal(row.货物品名, '配件; 工具');
  assert.equal(row.包装类型, '箱; 托');
  assert.equal(row.包装件数, 3);
  assert.equal(row.合计毛重, '1.67');
  assert.equal(row.合计体积, '1.02');
  assert.equal(row.备忘, '');
});

test('creates a downloadable xlsx workbook buffer', () => {
  const workbook = createWarehouseReceiptExportWorkbook([
    {
      备注: '普通备注',
      运输类型: '海运整柜',
      报关类型: '正报',
      工作号: 'JOB-001',
      客户: '客户A',
      货物品名: '鞋子',
      包装件数: 2,
      包装类型: 'CTN',
      合计体积: '0.02',
      合计毛重: '1.24',
      '目的港/目的地(MBL)': '洛杉矶',
      备忘: '',
      发货人: '发货人A',
      内部备注: '内部备注',
      入仓时间: '2026-04-20 09:30',
      HBL号: 'HBL-001',
      库房名称: '一号仓',
    },
  ]);

  assert.equal(workbook.subarray(0, 2).toString('utf8'), 'PK');
  const content = workbook.toString('utf8');
  assert.match(content, /xl\/worksheets\/sheet1\.xml/);
  assert.match(content, /JOB-001/);
  assert.match(content, /工作号/);
});
