CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_type" varchar(50),
	"file_url" text NOT NULL,
	"file_size" integer,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cargo_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"container_id" uuid,
	"shipment_id" uuid NOT NULL,
	"commodity_cn" text NOT NULL,
	"commodity_en" text,
	"hs_code" varchar(20),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit" varchar(20),
	"gross_weight" numeric(12, 3),
	"volume" numeric(12, 3),
	"marks" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "containers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"container_no" varchar(11),
	"container_type" varchar(10),
	"seal_no" varchar(50),
	"vgm_weight" numeric(12, 3),
	"tare_weight" numeric(12, 3),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "containers_container_no_unique" UNIQUE("container_no")
);
--> statement-breakpoint
CREATE TABLE "credit_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"amount" integer NOT NULL,
	"remaining_amount" integer,
	"payment_id" text,
	"expiration_date" timestamp,
	"expiration_date_processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"shipment_id" uuid NOT NULL,
	"container_id" uuid,
	"allocated_qty" integer NOT NULL,
	"picked_qty" integer DEFAULT 0 NOT NULL,
	"loaded_qty" integer DEFAULT 0 NOT NULL,
	"shipped_qty" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'ALLOCATED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"commodity_name" text,
	"sku_code" varchar(50),
	"initial_qty" integer NOT NULL,
	"current_qty" integer NOT NULL,
	"unit" varchar(10),
	"bin_location" varchar(50),
	"weight_total" numeric(12, 3),
	"length_cm" numeric(12, 3),
	"width_cm" numeric(12, 3),
	"height_cm" numeric(12, 3),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"ref_type" varchar(30) NOT NULL,
	"ref_id" uuid,
	"qty_delta" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50),
	"name_cn" text NOT NULL,
	"name_en" text,
	"roles" varchar(20)[] NOT NULL,
	"tax_no" varchar(50),
	"contact_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "parties_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"price_id" text NOT NULL,
	"type" text NOT NULL,
	"scene" text,
	"interval" text,
	"user_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"subscription_id" text,
	"session_id" text,
	"invoice_id" text,
	"status" text NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"cancel_at_period_end" boolean,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_no" varchar(30) NOT NULL,
	"mbl_no" varchar(50),
	"hbl_no" varchar(50),
	"client_id" uuid,
	"shipper_id" uuid,
	"consignee_id" uuid,
	"agent_id" uuid,
	"carrier_id" uuid,
	"pol_id" uuid,
	"pod_id" uuid,
	"transport_mode" varchar(10) DEFAULT 'SEA' NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"etd" timestamp with time zone,
	"eta" timestamp with time zone,
	"remarks" text,
	"extra_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shipments_job_no_unique" UNIQUE("job_no")
);
--> statement-breakpoint
CREATE TABLE "transport_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"un_locode" char(5),
	"name_cn" text NOT NULL,
	"name_en" text,
	"country_code" char(2),
	"type" varchar(10),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "transport_nodes_un_locode_unique" UNIQUE("un_locode")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"customer_id" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_credit" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_credits" integer DEFAULT 0 NOT NULL,
	"last_refresh_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "warehouse_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_no" varchar(30) NOT NULL,
	"warehouse_id" uuid,
	"customer_id" uuid,
	"status" varchar(20) DEFAULT 'RECEIVED' NOT NULL,
	"inbound_time" timestamp with time zone DEFAULT now(),
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "warehouse_receipts_receipt_no_unique" UNIQUE("receipt_no")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"contact_person" varchar(100),
	"phone" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargo_items" ADD CONSTRAINT "cargo_items_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargo_items" ADD CONSTRAINT "cargo_items_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "containers" ADD CONSTRAINT "containers_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_receipt_id_warehouse_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."warehouse_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_client_id_parties_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shipper_id_parties_id_fk" FOREIGN KEY ("shipper_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_consignee_id_parties_id_fk" FOREIGN KEY ("consignee_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_agent_id_parties_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_carrier_id_parties_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_pol_id_transport_nodes_id_fk" FOREIGN KEY ("pol_id") REFERENCES "public"."transport_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_pod_id_transport_nodes_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."transport_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credit" ADD CONSTRAINT "user_credit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_receipts" ADD CONSTRAINT "warehouse_receipts_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_receipts" ADD CONSTRAINT "warehouse_receipts_customer_id_parties_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_account_id_idx" ON "account" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_provider_id_idx" ON "account" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_shipment_id" ON "attachments" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "idx_cargo_shipment" ON "cargo_items" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "idx_cargo_container_id" ON "cargo_items" USING btree ("container_id");--> statement-breakpoint
CREATE INDEX "idx_containers_shipment_id" ON "containers" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "credit_transaction_user_id_idx" ON "credit_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transaction_type_idx" ON "credit_transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_alloc_inventory_item" ON "inventory_allocations" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_alloc_shipment" ON "inventory_allocations" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "idx_alloc_container" ON "inventory_allocations" USING btree ("container_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_receipt" ON "inventory_items" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "idx_movements_inventory_item" ON "inventory_movements" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_parties_code" ON "parties" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_parties_is_active" ON "parties" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payment_type_idx" ON "payment" USING btree ("type");--> statement-breakpoint
CREATE INDEX "payment_scene_idx" ON "payment" USING btree ("scene");--> statement-breakpoint
CREATE INDEX "payment_price_id_idx" ON "payment" USING btree ("price_id");--> statement-breakpoint
CREATE INDEX "payment_user_id_idx" ON "payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_customer_id_idx" ON "payment" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_paid_idx" ON "payment" USING btree ("paid");--> statement-breakpoint
CREATE INDEX "payment_subscription_id_idx" ON "payment" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "payment_session_id_idx" ON "payment" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "payment_invoice_id_idx" ON "payment" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_shipments_job_no" ON "shipments" USING btree ("job_no");--> statement-breakpoint
CREATE INDEX "idx_shipments_mbl" ON "shipments" USING btree ("mbl_no");--> statement-breakpoint
CREATE INDEX "idx_shipment_parties" ON "shipments" USING btree ("client_id","shipper_id","consignee_id");--> statement-breakpoint
CREATE INDEX "idx_transport_nodes_un_locode" ON "transport_nodes" USING btree ("un_locode");--> statement-breakpoint
CREATE INDEX "idx_transport_nodes_country_code" ON "transport_nodes" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "user" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_customer_id_idx" ON "user" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_credit_user_id_idx" ON "user_credit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_warehouse_receipts_warehouse" ON "warehouse_receipts" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_warehouse_receipts_customer" ON "warehouse_receipts" USING btree ("customer_id");