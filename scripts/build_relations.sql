-- 开启 UUID 扩展 (PostgreSQL 13+ 默认包含)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

---
--- 1. 基础档案表
---
-- 合作伙伴表 (客户、船司、代理、供应商)
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,           -- 企业内部代码
    name_cn TEXT NOT NULL,
    name_en TEXT,
    roles VARCHAR(20)[] NOT NULL,      -- 使用数组存储角色: {SHIPPER, CONSIGNEE, CARRIER, AGENT}
    tax_no VARCHAR(50),
    contact_info JSONB DEFAULT '{}',   -- 存储多个联系人、电话、邮箱
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 运输节点表（用于 POL/POD：港口/机场/铁路站/口岸等）
CREATE TABLE transport_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    un_locode CHAR(5) UNIQUE,          -- 国际标准代码: CNSHA, USLAX
    name_cn TEXT NOT NULL,
    name_en TEXT,
    country_code CHAR(2),              -- CN, US
    type VARCHAR(10) CHECK (type IN ('SEA', 'AIR', 'RAIL', 'ROAD')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
---
--- 2. 入库商品
---
--
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    -- 可以存储仓库平面图或经纬度
    metadata JSONB DEFAULT '{}',
    remarks TEXT,  -- 备注
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE warehouse_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no VARCHAR(30) UNIQUE NOT NULL, -- 入库单号 (如 WHR20251201), 收据单右上方
    warehouse_id UUID REFERENCES warehouses(id),
    customer_id UUID REFERENCES parties(id), -- 货主

    status VARCHAR(20) DEFAULT 'RECEIVED', -- RECEIVED (已入库), SHIPPED (已出库), PARTIAL (部分发货)
    inbound_time TIMESTAMPTZ DEFAULT NOW(),

    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 入库商品明细
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID REFERENCES warehouse_receipts(id) ON DELETE CASCADE,

    -- 基础属性
    commodity_name TEXT, -- 中文品名
    sku_code VARCHAR(50), -- 如果有库存管理需求，可以记录SKU

    -- 数量管理
    initial_qty INTEGER NOT NULL,  -- 入库总数
    current_qty INTEGER NOT NULL,  -- 当前剩余库存
    unit VARCHAR(10),             -- CTNS / PCS / BALES /BAGS/WOODEN BOX/WOODEN PALLET/PLASTIC PALLET/METAL PALLET/OTHER

    -- 存放位置
    bin_location VARCHAR(50),      -- 库位编号：如 A-01-05

    weight_total NUMERIC(12, 3), -- 毛重(KG)
    length_cm NUMERIC(12, 3), -- 单件长度(cm)
    width_cm NUMERIC(12, 3), -- 单件宽度(cm)
    height_cm NUMERIC(12, 3), -- 单件高度(cm)

    created_at TIMESTAMPTZ DEFAULT NOW()
);

---
--- 3. 业务核心表 (Shipment -> Container -> Cargo)
---

-- 业务主单表
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_no VARCHAR(30) UNIQUE NOT NULL, -- 系统生成的唯一业务号
    mbl_no VARCHAR(50),                 -- 母单号 (Master B/L)
    hbl_no VARCHAR(50),                 -- 分单号 (House B/L)

    -- 角色关联
    client_id UUID REFERENCES parties(id),
    shipper_id UUID REFERENCES parties(id),
    consignee_id UUID REFERENCES parties(id),
    agent_id UUID REFERENCES parties(id),   -- 海外代理
    carrier_id UUID REFERENCES parties(id), -- 船公司/航司

    -- 路由信息
    pol_id UUID REFERENCES transport_nodes(id),   -- 起运港
    pod_id UUID REFERENCES transport_nodes(id),   -- 目的港

    transport_mode VARCHAR(10) DEFAULT 'SEA', -- SEA/AIR/RAIL
    status VARCHAR(20) DEFAULT 'DRAFT',       -- DRAFT, BOOKED, SHIPPED, ARRIVED, CLOSED

    etd TIMESTAMPTZ, -- 预计离港
    eta TIMESTAMPTZ, -- 预计到达

    remarks TEXT,
    extra_data JSONB DEFAULT '{}', -- 存放特殊的业务字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 集装箱表
CREATE TABLE containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,

    container_no VARCHAR(11) UNIQUE,   -- 11位标准箱号
    container_type VARCHAR(10), -- 20GP, 40HQ, 20RF等
    seal_no VARCHAR(50),        -- 封条号

    vgm_weight NUMERIC(12, 3),  -- VGM重量
    tare_weight NUMERIC(12, 3), -- 箱体自重

    created_at TIMESTAMPTZ DEFAULT NOW()
);

---
--- 4. 仓库出货/装柜（关键补充：解决拆分出库、部分出库、可追溯）
---

-- 库存分配/拣货/装柜/出库明细：
-- 一个 inventory_item（入库批次）可以分给多个 shipment / 多个柜，并支持部分出库
CREATE TABLE inventory_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    container_id UUID REFERENCES containers(id) ON DELETE SET NULL,

    allocated_qty INTEGER NOT NULL, -- 预占/分配数量
    picked_qty INTEGER NOT NULL DEFAULT 0,
    loaded_qty INTEGER NOT NULL DEFAULT 0,
    shipped_qty INTEGER NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'ALLOCATED', -- ALLOCATED/PICKED/LOADED/SHIPPED/CANCELLED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 库存流水（审计/可回溯/可冲销）：
-- qty_delta 入库为正，出库为负；ref_type/ref_id 用于关联到具体业务/单据
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    ref_type VARCHAR(30) NOT NULL,  -- RECEIPT/ALLOCATION/PICK/LOAD/SHIP/ADJUST
    ref_id UUID,
    qty_delta INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 货物明细表 (支持一个柜子装多种货)
CREATE TABLE cargo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE, -- 冗余关联方便直接按Shipment查询

    commodity_cn TEXT NOT NULL, -- 中文品名
    commodity_en TEXT,          -- 英文品名
    hs_code VARCHAR(20),        -- 海关编码

    quantity INTEGER DEFAULT 1, -- 件数
    unit VARCHAR(20),           -- 单位: CTNS, PLTS, ROLLS
    gross_weight NUMERIC(12, 3),-- 毛重(KG)
    volume NUMERIC(12, 3),      -- 体积(CBM)
    marks TEXT,                 -- 唛头

    created_at TIMESTAMPTZ DEFAULT NOW()
);

---
--- 5. 辅助功能表
---

-- 附件/单证表
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,

    file_name TEXT NOT NULL,
    file_type VARCHAR(50),      -- B/L, Invoice, Packing List, Photo
    file_url TEXT NOT NULL,      -- 云存储地址 (S3/OSS)
    file_size INTEGER,

    uploaded_by UUID,           -- 关联用户表(如有)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

---
--- 6. 索引优化 (提高查询效率)
---

CREATE INDEX idx_shipments_job_no ON shipments(job_no);
CREATE INDEX idx_shipments_mbl ON shipments(mbl_no);
-- container_no 已设置 UNIQUE，额外普通索引意义不大
CREATE INDEX idx_shipment_parties ON shipments(client_id, shipper_id, consignee_id);
CREATE INDEX idx_containers_shipment_id ON containers(shipment_id);
CREATE INDEX idx_cargo_shipment ON cargo_items(shipment_id);
CREATE INDEX idx_cargo_container_id ON cargo_items(container_id);
CREATE INDEX idx_attachments_shipment_id ON attachments(shipment_id);

-- 常用外键索引（仓库侧）
CREATE INDEX idx_warehouse_receipts_warehouse ON warehouse_receipts(warehouse_id);
CREATE INDEX idx_warehouse_receipts_customer ON warehouse_receipts(customer_id);
CREATE INDEX idx_inventory_items_receipt ON inventory_items(receipt_id);

-- 出库/装柜侧
CREATE INDEX idx_alloc_inventory_item ON inventory_allocations(inventory_item_id);
CREATE INDEX idx_alloc_shipment ON inventory_allocations(shipment_id);
CREATE INDEX idx_alloc_container ON inventory_allocations(container_id);
CREATE INDEX idx_movements_inventory_item ON inventory_movements(inventory_item_id);




