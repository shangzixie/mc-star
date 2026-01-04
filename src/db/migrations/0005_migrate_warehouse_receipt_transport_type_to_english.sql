DO $$
DECLARE
  mapping jsonb := jsonb_build_object(
    '海运整柜', 'SEA_FCL',
    '航空货运', 'AIR_FREIGHT',
    '海运拼箱', 'SEA_LCL',
    '内贸运输', 'DOMESTIC_TRANSPORT',
    '仓储服务', 'WAREHOUSING',
    '陆路运输（整车）', 'ROAD_FTL',
    '陆路运输（拼车）', 'ROAD_LTL',
    '快递/专线', 'EXPRESS_LINEHAUL',
    'FBA海运', 'FBA_SEA',
    'FBA空运', 'FBA_AIR',
    'FBA铁路', 'FBA_RAIL',
    '散杂货船', 'BULK_CARGO',
    '铁路运输', 'RAIL_FREIGHT'
  );
  k text;
  v text;
  type_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'warehouse_receipt_transport_type'
  ) INTO type_exists;

  IF NOT type_exists THEN
    CREATE TYPE "public"."warehouse_receipt_transport_type" AS ENUM (
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
      'RAIL_FREIGHT'
    );
  END IF;

  -- If the enum already exists with Chinese values, rename them in-place to English codes.
  FOR k, v IN SELECT * FROM jsonb_each_text(mapping)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'warehouse_receipt_transport_type'
        AND e.enumlabel = k
    ) THEN
      EXECUTE format(
        'ALTER TYPE "public"."warehouse_receipt_transport_type" RENAME VALUE %L TO %L',
        k,
        v
      );
    END IF;
  END LOOP;

  -- Ensure column exists even if earlier migration wasn't applied.
  EXECUTE 'ALTER TABLE "warehouse_receipts" ADD COLUMN IF NOT EXISTS "transport_type" "warehouse_receipt_transport_type"';
  EXECUTE 'COMMENT ON COLUMN "warehouse_receipts"."transport_type" IS ''运输类型''';
END $$;


