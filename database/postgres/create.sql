-- public.caomei_auth_account definition

-- Drop table

-- DROP TABLE public.caomei_auth_account;

CREATE TABLE public.caomei_auth_account (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	account_id text NOT NULL,
	provider_id text NOT NULL,
	user_id varchar(36) NOT NULL,
	access_token text NULL,
	refresh_token text NULL,
	id_token text NULL,
	access_token_expires_at timestamptz NULL,
	refresh_token_expires_at timestamptz NULL,
	"scope" text NULL,
	"password" text NULL,
	CONSTRAINT "PK_60bb887dbada52e154a3169c36e" PRIMARY KEY (id)
);


-- public.caomei_auth_session definition

-- Drop table

-- DROP TABLE public.caomei_auth_session;

CREATE TABLE public.caomei_auth_session (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	expires_at timestamptz NOT NULL,
	"token" text NOT NULL,
	ip_address text NULL,
	user_agent text NULL,
	user_id varchar(36) NOT NULL,
	impersonated_by varchar(36) NULL,
	CONSTRAINT "PK_0a0af6fb921a4c466bc86ccdbe5" PRIMARY KEY (id)
);


-- public.caomei_auth_user definition

-- Drop table

-- DROP TABLE public.caomei_auth_user;

CREATE TABLE public.caomei_auth_user (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	email varchar(255) NOT NULL,
	email_verified bool DEFAULT false NOT NULL,
	image text NULL,
	username varchar(128) NULL,
	display_username varchar(128) NULL,
	is_anonymous bool DEFAULT false NOT NULL,
	phone_number varchar(64) NULL,
	phone_number_verified bool DEFAULT false NOT NULL,
	"role" varchar(32) DEFAULT 'user'::character varying NULL,
	banned bool DEFAULT false NOT NULL,
	ban_reason text NULL,
	ban_expires int4 NULL,
	CONSTRAINT "PK_8e449c5c3ca6bfe96e55e1891d0" PRIMARY KEY (id)
);


-- public.caomei_auth_verification definition

-- Drop table

-- DROP TABLE public.caomei_auth_verification;

CREATE TABLE public.caomei_auth_verification (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	identifier text NOT NULL,
	value text NOT NULL,
	expires_at timestamptz NOT NULL,
	CONSTRAINT "PK_c0451931f08cae54f9e77a828ed" PRIMARY KEY (id)
);
