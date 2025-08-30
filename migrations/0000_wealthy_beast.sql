CREATE TABLE "certificates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_id" text NOT NULL,
	"producer_address" text NOT NULL,
	"hydrogen_kg" integer NOT NULL,
	"energy_source" text NOT NULL,
	"location" text NOT NULL,
	"production_date" timestamp NOT NULL,
	"issue_date" timestamp DEFAULT now(),
	"certifier_name" text NOT NULL,
	"signature" text NOT NULL,
	"status" text DEFAULT 'valid',
	CONSTRAINT "certificates_certificate_id_unique" UNIQUE("certificate_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tx_hash" text NOT NULL,
	"from_address" text NOT NULL,
	"to_address" text NOT NULL,
	"amount" integer NOT NULL,
	"tx_type" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"signature" text,
	"data" jsonb,
	"status" text DEFAULT 'confirmed',
	CONSTRAINT "transactions_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text NOT NULL,
	"wallet_address" text,
	"name" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"private_key" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"balance" integer DEFAULT 0,
	CONSTRAINT "wallets_address_unique" UNIQUE("address")
);
