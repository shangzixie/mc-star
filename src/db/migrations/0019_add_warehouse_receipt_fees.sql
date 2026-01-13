CREATE TABLE "warehouse_receipt_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"fee_type" varchar(10) NOT NULL,
	"fee_name" text NOT NULL,
	"unit" varchar(20),
	"currency" varchar(10),
	"price" numeric(18, 6),
	"quantity" numeric(18, 6),
	"original_amount" numeric(18, 2),
	"settled_currency" varchar(10),
	"exchange_rate" numeric(18, 6),
	"settled_amount" numeric(18, 2),
	"payment_method" varchar(10),
	"party_id" uuid,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "warehouse_receipt_fees" ADD CONSTRAINT "warehouse_receipt_fees_receipt_id_warehouse_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."warehouse_receipts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "warehouse_receipt_fees" ADD CONSTRAINT "warehouse_receipt_fees_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_warehouse_receipt_fees_receipt_id" ON "warehouse_receipt_fees" USING btree ("receipt_id");
--> statement-breakpoint
CREATE INDEX "idx_warehouse_receipt_fees_receipt_id_fee_type" ON "warehouse_receipt_fees" USING btree ("receipt_id","fee_type");

