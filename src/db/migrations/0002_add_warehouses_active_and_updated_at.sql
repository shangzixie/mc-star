ALTER TABLE "warehouses"
ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "warehouses"
ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();


