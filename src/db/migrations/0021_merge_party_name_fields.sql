-- Merge name_cn and name_en into a single name field
-- Migration strategy: prefer name_cn, fallback to name_en if name_cn is empty

-- Step 1: Add the new name column (nullable initially)
ALTER TABLE parties
  ADD COLUMN name TEXT;

-- Step 2: Migrate existing data: prefer name_cn, fallback to name_en
UPDATE parties
SET name = COALESCE(
  NULLIF(TRIM(name_cn), ''),
  NULLIF(TRIM(name_en), ''),
  ''
);

-- Step 3: Set name as NOT NULL (after data migration)
ALTER TABLE parties
  ALTER COLUMN name SET NOT NULL;

-- Step 4: Drop the old columns
ALTER TABLE parties
  DROP COLUMN name_cn,
  DROP COLUMN name_en;
