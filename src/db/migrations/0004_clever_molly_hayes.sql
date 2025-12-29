ALTER TABLE "payment" ADD COLUMN "invoice_id" text;--> statement-breakpoint
CREATE INDEX "payment_invoice_id_idx" ON "payment" USING btree ("invoice_id");--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_unique" UNIQUE("invoice_id");