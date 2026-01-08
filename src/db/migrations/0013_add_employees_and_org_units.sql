CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"full_name" text NOT NULL,
	"branch" text NOT NULL,
	"department" text NOT NULL,
	CONSTRAINT "employees_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_employees_branch" ON "employees" USING btree ("branch");--> statement-breakpoint
CREATE INDEX "idx_employees_department" ON "employees" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_employees_user_id" ON "employees" USING btree ("user_id");

