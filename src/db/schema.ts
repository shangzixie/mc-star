import {
  boolean,
  char,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	role: text('role').notNull().default('user'), // 'user' or 'admin'
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	customerId: text('customer_id'),
}, (table) => ({
	userIdIdx: index("user_id_idx").on(table.id),
	userCustomerIdIdx: index("user_customer_id_idx").on(table.customerId),
	userRoleIdx: index("user_role_idx").on(table.role),
}));

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	impersonatedBy: text('impersonated_by')
}, (table) => ({
	sessionTokenIdx: index("session_token_idx").on(table.token),
	sessionUserIdIdx: index("session_user_id_idx").on(table.userId),
}));

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
}, (table) => ({
	accountUserIdIdx: index("account_user_id_idx").on(table.userId),
	accountAccountIdIdx: index("account_account_id_idx").on(table.accountId),
	accountProviderIdIdx: index("account_provider_id_idx").on(table.providerId),
}));

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

export const invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	email: text('email').notNull().unique(),
	invitedBy: text('invited_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
	usedAt: timestamp('used_at'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
	invitationEmailIdx: index("invitation_email_idx").on(table.email),
	invitationTokenIdx: index("invitation_token_idx").on(table.token),
	invitationInvitedByIdx: index("invitation_invited_by_idx").on(table.invitedBy),
}));

export const payment = pgTable("payment", {
	id: text("id").primaryKey(),
	priceId: text('price_id').notNull(),
	type: text('type').notNull(),
	scene: text('scene'), // payment scene: 'lifetime', 'credit', 'subscription'
	interval: text('interval'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	customerId: text('customer_id').notNull(),
	subscriptionId: text('subscription_id'),
	sessionId: text('session_id'),
	invoiceId: text('invoice_id').unique(), // unique constraint for avoiding duplicate processing
	status: text('status').notNull(),
	paid: boolean('paid').notNull().default(false), // indicates whether payment is completed (set in invoice.paid event)
	periodStart: timestamp('period_start'),
	periodEnd: timestamp('period_end'),
	cancelAtPeriodEnd: boolean('cancel_at_period_end'),
	trialStart: timestamp('trial_start'),
	trialEnd: timestamp('trial_end'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
	paymentTypeIdx: index("payment_type_idx").on(table.type),
	paymentSceneIdx: index("payment_scene_idx").on(table.scene),
	paymentPriceIdIdx: index("payment_price_id_idx").on(table.priceId),
	paymentUserIdIdx: index("payment_user_id_idx").on(table.userId),
	paymentCustomerIdIdx: index("payment_customer_id_idx").on(table.customerId),
	paymentStatusIdx: index("payment_status_idx").on(table.status),
	paymentPaidIdx: index("payment_paid_idx").on(table.paid),
	paymentSubscriptionIdIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
	paymentSessionIdIdx: index("payment_session_id_idx").on(table.sessionId),
	paymentInvoiceIdIdx: index("payment_invoice_id_idx").on(table.invoiceId),
}));

export const userCredit = pgTable("user_credit", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	currentCredits: integer("current_credits").notNull().default(0),
	lastRefreshAt: timestamp("last_refresh_at"), // deprecated
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	userCreditUserIdIdx: index("user_credit_user_id_idx").on(table.userId),
}));

export const creditTransaction = pgTable("credit_transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	type: text("type").notNull(),
	description: text("description"),
	amount: integer("amount").notNull(),
	remainingAmount: integer("remaining_amount"),
	paymentId: text("payment_id"), // field name is paymentId, but actually it's invoiceId
	expirationDate: timestamp("expiration_date"),
	expirationDateProcessedAt: timestamp("expiration_date_processed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	creditTransactionUserIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
	creditTransactionTypeIdx: index("credit_transaction_type_idx").on(table.type),
}));

// -----------------------------------------------------------------------------
// Freight Forwarding / Warehouse outbound-loading relations (scripts/build_relations.sql)
// -----------------------------------------------------------------------------

export const warehouseReceiptTransportType = pgEnum(
  'warehouse_receipt_transport_type',
  [
    // 运输类型（存储英文枚举码；UI 通过 i18n 显示中文）
    // SEA_FCL: 海运整柜
    // AIR_FREIGHT: 航空货运
    // SEA_LCL: 海运拼箱
    // DOMESTIC_TRANSPORT: 内贸运输
    // WAREHOUSING: 仓储服务
    // ROAD_FTL: 陆路运输（整车）
    // ROAD_LTL: 陆路运输（拼车）
    // EXPRESS_LINEHAUL: 快递/专线
    // FBA_SEA: FBA海运
    // FBA_AIR: FBA空运
    // FBA_RAIL: FBA铁路
    // BULK_CARGO: 散杂货船
    // RAIL_FREIGHT: 铁路运输
    'SEA_FCL',
    'AIR_FREIGHT',
    'SEA_LCL',
    'DOMESTIC_TRANSPORT',
    'WAREHOUSING',
    'ROAD_FTL',
    'ROAD_LTL',
    'EXPRESS_LINEHAUL',
    'FBA_SEA',
    'FBA_AIR',
    'FBA_RAIL',
    'BULK_CARGO',
    'RAIL_FREIGHT',
  ]
);

export const warehouseReceiptCustomsDeclarationType = pgEnum(
  'warehouse_receipt_customs_declaration_type',
  [
    // 报关类型（存储英文枚举码；UI 通过 i18n 显示中文）
    // NO_DECLARATION: 不报关
    // BUY_ORDER: 买单
    // FORMAL_DECLARATION: 正报
    'NO_DECLARATION',
    'BUY_ORDER',
    'FORMAL_DECLARATION',
  ]
);

export const parties = pgTable(
  'parties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).unique(),
    nameCn: text('name_cn').notNull(),
    nameEn: text('name_en'),
    roles: varchar('roles', { length: 20 }).array().notNull(),
    taxNo: varchar('tax_no', { length: 50 }),
    contactInfo: jsonb('contact_info').notNull().default({}),
    address: text('address'),
    remarks: text('remarks'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    partiesCodeIdx: index('idx_parties_code').on(table.code),
    partiesActiveIdx: index('idx_parties_is_active').on(table.isActive),
  })
);

export const transportNodes = pgTable(
  'transport_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    unLocode: char('un_locode', { length: 5 }).unique(),
    nameCn: text('name_cn').notNull(),
    nameEn: text('name_en'),
    countryCode: char('country_code', { length: 2 }),
    type: varchar('type', { length: 10 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    transportNodesUnLocodeIdx: index('idx_transport_nodes_un_locode').on(
      table.unLocode
    ),
    transportNodesCountryCodeIdx: index('idx_transport_nodes_country_code').on(
      table.countryCode
    ),
  })
);

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  metadata: jsonb('metadata').notNull().default({}),
  remarks: text('remarks'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const warehouseReceipts = pgTable(
  'warehouse_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptNo: varchar('receipt_no', { length: 30 }).notNull().unique(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id),
    customerId: uuid('customer_id').references(() => parties.id),
    transportType: warehouseReceiptTransportType('transport_type'),
    customsDeclarationType: warehouseReceiptCustomsDeclarationType(
      'customs_declaration_type'
    )
      .notNull()
      .default('NO_DECLARATION'),
    status: varchar('status', { length: 20 }).notNull().default('RECEIVED'),
    inboundTime: timestamp('inbound_time', { withTimezone: true }).defaultNow(),
    remarks: text('remarks'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxWarehouseReceiptsWarehouse: index('idx_warehouse_receipts_warehouse').on(
      table.warehouseId
    ),
    idxWarehouseReceiptsCustomer: index('idx_warehouse_receipts_customer').on(
      table.customerId
    ),
  })
);

export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptId: uuid('receipt_id')
      .references(() => warehouseReceipts.id, { onDelete: 'cascade' })
      .notNull(),
    commodityName: text('commodity_name'),
    skuCode: varchar('sku_code', { length: 50 }),
    initialQty: integer('initial_qty').notNull(),
    currentQty: integer('current_qty').notNull(),
    unit: varchar('unit', { length: 10 }),
    binLocation: varchar('bin_location', { length: 50 }),
    weightPerUnit: numeric('weight_per_unit', { precision: 12, scale: 3 }),
    lengthCm: numeric('length_cm', { precision: 12, scale: 3 }),
    widthCm: numeric('width_cm', { precision: 12, scale: 3 }),
    heightCm: numeric('height_cm', { precision: 12, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxInventoryItemsReceipt: index('idx_inventory_items_receipt').on(
      table.receiptId
    ),
  })
);

export const shipments = pgTable(
  'shipments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobNo: varchar('job_no', { length: 30 }).notNull().unique(),
    mblNo: varchar('mbl_no', { length: 50 }),
    hblNo: varchar('hbl_no', { length: 50 }),
    clientId: uuid('client_id').references(() => parties.id),
    shipperId: uuid('shipper_id').references(() => parties.id),
    consigneeId: uuid('consignee_id').references(() => parties.id),
    agentId: uuid('agent_id').references(() => parties.id),
    carrierId: uuid('carrier_id').references(() => parties.id),
    polId: uuid('pol_id').references(() => transportNodes.id),
    podId: uuid('pod_id').references(() => transportNodes.id),
    transportMode: varchar('transport_mode', { length: 10 })
      .notNull()
      .default('SEA'),
    status: varchar('status', { length: 20 }).notNull().default('DRAFT'),
    etd: timestamp('etd', { withTimezone: true }),
    eta: timestamp('eta', { withTimezone: true }),
    remarks: text('remarks'),
    extraData: jsonb('extra_data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxShipmentsJobNo: index('idx_shipments_job_no').on(table.jobNo),
    idxShipmentsMbl: index('idx_shipments_mbl').on(table.mblNo),
    idxShipmentParties: index('idx_shipment_parties').on(
      table.clientId,
      table.shipperId,
      table.consigneeId
    ),
  })
);

export const containers = pgTable(
  'containers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shipmentId: uuid('shipment_id')
      .references(() => shipments.id, { onDelete: 'cascade' })
      .notNull(),
    containerNo: varchar('container_no', { length: 11 }).unique(),
    containerType: varchar('container_type', { length: 10 }),
    sealNo: varchar('seal_no', { length: 50 }),
    vgmWeight: numeric('vgm_weight', { precision: 12, scale: 3 }),
    tareWeight: numeric('tare_weight', { precision: 12, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxContainersShipmentId: index('idx_containers_shipment_id').on(
      table.shipmentId
    ),
  })
);

export const inventoryAllocations = pgTable(
  'inventory_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inventoryItemId: uuid('inventory_item_id')
      .references(() => inventoryItems.id, { onDelete: 'restrict' })
      .notNull(),
    shipmentId: uuid('shipment_id')
      .references(() => shipments.id, { onDelete: 'cascade' })
      .notNull(),
    containerId: uuid('container_id').references(() => containers.id, {
      onDelete: 'set null',
    }),
    allocatedQty: integer('allocated_qty').notNull(),
    pickedQty: integer('picked_qty').notNull().default(0),
    loadedQty: integer('loaded_qty').notNull().default(0),
    shippedQty: integer('shipped_qty').notNull().default(0),
    status: varchar('status', { length: 20 }).notNull().default('ALLOCATED'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxAllocInventoryItem: index('idx_alloc_inventory_item').on(
      table.inventoryItemId
    ),
    idxAllocShipment: index('idx_alloc_shipment').on(table.shipmentId),
    idxAllocContainer: index('idx_alloc_container').on(table.containerId),
  })
);

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inventoryItemId: uuid('inventory_item_id')
      .references(() => inventoryItems.id, { onDelete: 'restrict' })
      .notNull(),
    refType: varchar('ref_type', { length: 30 }).notNull(),
    refId: uuid('ref_id'),
    qtyDelta: integer('qty_delta').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxMovementsInventoryItem: index('idx_movements_inventory_item').on(
      table.inventoryItemId
    ),
  })
);

export const cargoItems = pgTable(
  'cargo_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    containerId: uuid('container_id').references(() => containers.id, {
      onDelete: 'cascade',
    }),
    shipmentId: uuid('shipment_id')
      .references(() => shipments.id, { onDelete: 'cascade' })
      .notNull(),
    commodityCn: text('commodity_cn').notNull(),
    commodityEn: text('commodity_en'),
    hsCode: varchar('hs_code', { length: 20 }),
    quantity: integer('quantity').notNull().default(1),
    unit: varchar('unit', { length: 20 }),
    grossWeight: numeric('gross_weight', { precision: 12, scale: 3 }),
    volume: numeric('volume', { precision: 12, scale: 3 }),
    marks: text('marks'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxCargoShipment: index('idx_cargo_shipment').on(table.shipmentId),
    idxCargoContainerId: index('idx_cargo_container_id').on(table.containerId),
  })
);

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shipmentId: uuid('shipment_id')
      .references(() => shipments.id, { onDelete: 'cascade' })
      .notNull(),
    fileName: text('file_name').notNull(),
    fileType: varchar('file_type', { length: 50 }),
    fileUrl: text('file_url').notNull(),
    fileSize: integer('file_size'),
    uploadedBy: uuid('uploaded_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxAttachmentsShipmentId: index('idx_attachments_shipment_id').on(
      table.shipmentId
    ),
  })
);
