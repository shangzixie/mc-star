ALTER TABLE "payment" ADD COLUMN "paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "payment_paid_idx" ON "payment" USING btree ("paid");