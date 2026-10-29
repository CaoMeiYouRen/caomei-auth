-- public.caomei_auth_two_factor definition

-- Drop table

-- DROP TABLE public.caomei_auth_two_factor;

CREATE TABLE public.caomei_auth_two_factor (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	user_id varchar(36) NOT NULL,
	secret text NOT NULL,
	backup_codes text NULL,
	CONSTRAINT "PK_9ad9146e5846f04d44eb40299e8" PRIMARY KEY (id)
);
CREATE INDEX "IDX_ed7df12901fcf60dc40654dc47" ON public.caomei_auth_two_factor USING btree (user_id);


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
	two_factor_enabled bool DEFAULT false NOT NULL,
	CONSTRAINT "PK_8e449c5c3ca6bfe96e55e1891d0" PRIMARY KEY (id)
);
CREATE UNIQUE INDEX "IDX_7de537c03bf5bbe41219f4f2e2" ON public.caomei_auth_user USING btree (phone_number);
CREATE UNIQUE INDEX "IDX_eaed40cc28f3c6cdcfdfbfea9c" ON public.caomei_auth_user USING btree (email);
CREATE UNIQUE INDEX "IDX_fd9926712ead987f3ccb24744c" ON public.caomei_auth_user USING btree (username);


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
CREATE INDEX "IDX_21fa41ec0f7ea099140837714d" ON public.caomei_auth_verification USING btree (identifier);
CREATE INDEX "IDX_fa68522a992ad7d16ac6f652d2" ON public.caomei_auth_verification USING btree (identifier, value);


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
	CONSTRAINT "PK_60bb887dbada52e154a3169c36e" PRIMARY KEY (id),
	CONSTRAINT "FK_6415e014be607f933d913962c95" FOREIGN KEY (user_id) REFERENCES public.caomei_auth_user(id) ON DELETE CASCADE
);
CREATE INDEX "IDX_6415e014be607f933d913962c9" ON public.caomei_auth_account USING btree (user_id);


-- public.caomei_auth_oauth_client definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_client;

CREATE TABLE public.caomei_auth_oauth_client (
	id VARCHAR(36) NOT NULL PRIMARY KEY,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	client_id VARCHAR(191) NOT NULL,
	client_secret TEXT NULL,
	client_discovery_id VARCHAR(191) NULL,
	disabled BOOLEAN DEFAULT FALSE NOT NULL,
	skip_consent BOOLEAN NULL,
	enable_end_session BOOLEAN NULL,
	subject_type VARCHAR(32) NULL,
	scopes TEXT NULL,
	client_credentials_scopes TEXT NULL,
	user_id VARCHAR(36) NULL,
	name TEXT NULL,
	description TEXT NULL,
	uri TEXT NULL,
	icon TEXT NULL,
	contacts TEXT NULL,
	tos TEXT NULL,
	policy TEXT NULL,
	software_id VARCHAR(64) NULL,
	software_version VARCHAR(32) NULL,
	software_statement TEXT NULL,
	redirect_uris TEXT NOT NULL,
	post_logout_redirect_uris TEXT NULL,
	backchannel_logout_uri TEXT NULL,
	backchannel_logout_session_required BOOLEAN NULL,
	token_endpoint_auth_method VARCHAR(32) NULL,
	application_type VARCHAR(32) NULL,
	jwks TEXT NULL,
	jwks_uri TEXT NULL,
	grant_types TEXT NULL,
	response_types TEXT NULL,
	require_pkce BOOLEAN NULL,
	dpop_bound_access_tokens BOOLEAN DEFAULT FALSE NOT NULL,
	reference_id VARCHAR(191) NULL,
	metadata TEXT NULL
);

CREATE UNIQUE INDEX "IDX_7e27963e79c7ec5cb46ecbd3e0" ON public.caomei_auth_oauth_client USING btree (client_id);
CREATE INDEX "IDX_ed96c8129eaa026b4141b92877" ON public.caomei_auth_oauth_client USING btree (user_id);

-- public.caomei_auth_oauth_resource definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_resource;

CREATE TABLE public.caomei_auth_oauth_resource (
	id VARCHAR(36) NOT NULL PRIMARY KEY,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	identifier VARCHAR(768) NOT NULL,
	name TEXT NOT NULL,
	access_token_ttl INTEGER NULL,
	refresh_token_ttl INTEGER NULL,
	signing_algorithm VARCHAR(32) NULL,
	signing_key_id VARCHAR(191) NULL,
	allowed_scopes TEXT NULL,
	custom_claims TEXT NULL,
	dpop_bound_access_tokens_required BOOLEAN DEFAULT FALSE NOT NULL,
	disabled BOOLEAN DEFAULT FALSE NOT NULL,
	policy_version INTEGER DEFAULT 1 NOT NULL,
	metadata TEXT NULL,
	CONSTRAINT "UQ_63b7a3234cb7e761bb8ec431178" UNIQUE (identifier)
);

CREATE UNIQUE INDEX "undefined" ON public.caomei_auth_oauth_resource USING btree (identifier);

-- public.caomei_auth_oauth_client_resource definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_client_resource;

CREATE TABLE public.caomei_auth_oauth_client_resource (
	id VARCHAR(36) NOT NULL PRIMARY KEY,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	client_id VARCHAR(191) NOT NULL,
	resource_id VARCHAR(512) NOT NULL,
	metadata TEXT NULL,
	CONSTRAINT "IDX_16f4c39e99d3b2619a4e92992c" UNIQUE (client_id, resource_id)
);

CREATE INDEX "IDX_66d910ee583421b58c74f76d34" ON public.caomei_auth_oauth_client_resource USING btree (client_id);
CREATE INDEX "IDX_8a12fed2128cad8405547cd132" ON public.caomei_auth_oauth_client_resource USING btree (resource_id);

-- public.caomei_auth_oauth_access_token definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_access_token;

CREATE TABLE public.caomei_auth_oauth_access_token (
	id VARCHAR(36) NOT NULL PRIMARY KEY,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	token VARCHAR(255) NOT NULL,
	client_id VARCHAR(191) NOT NULL,
	session_id VARCHAR(36) NULL,
	user_id VARCHAR(36) NULL,
	reference_id VARCHAR(191) NULL,
	authorization_code_id VARCHAR(191) NULL,
	resources TEXT NULL,
	requested_user_info_claims TEXT NULL,
	refresh_id VARCHAR(36) NULL,
	expires_at timestamp with time zone DEFAULT now() NOT NULL,
	revoked timestamp with time zone NULL,
	confirmation TEXT NULL,
	scopes TEXT NOT NULL
);

CREATE UNIQUE INDEX "IDX_078f4bd43a276ea00117f6b5a7" ON public.caomei_auth_oauth_access_token USING btree (token);
CREATE INDEX "IDX_79dc2fd873300c86e710e1e573" ON public.caomei_auth_oauth_access_token USING btree (client_id);
CREATE INDEX "IDX_a204f51ebef92e5a0ac9abf81e" ON public.caomei_auth_oauth_access_token USING btree (session_id);
CREATE INDEX "IDX_993218a00f98d6c01350c75c48" ON public.caomei_auth_oauth_access_token USING btree (user_id);
CREATE INDEX "IDX_4884a51f27eebd700342707639" ON public.caomei_auth_oauth_access_token USING btree (authorization_code_id);
CREATE INDEX "IDX_0d00b3721ac96b0128088e83c6" ON public.caomei_auth_oauth_access_token USING btree (refresh_id);

-- public.caomei_auth_oauth_refresh_token definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_refresh_token;

CREATE TABLE public.caomei_auth_oauth_refresh_token (
	id VARCHAR(36) NOT NULL PRIMARY KEY,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	token VARCHAR(255) NOT NULL,
	client_id VARCHAR(191) NOT NULL,
	session_id VARCHAR(36) NULL,
	user_id VARCHAR(36) NOT NULL,
	reference_id VARCHAR(191) NULL,
	authorization_code_id VARCHAR(191) NULL,
	resources TEXT NULL,
	requested_user_info_claims TEXT NULL,
	expires_at timestamp with time zone DEFAULT now() NOT NULL,
	revoked timestamp with time zone NULL,
	rotated_at timestamp with time zone NULL,
	rotation_replay_response TEXT NULL,
	rotation_replay_expires_at timestamp with time zone NULL,
	auth_time timestamp with time zone NULL,
	confirmation TEXT NULL,
	scopes TEXT NOT NULL
);

CREATE UNIQUE INDEX "IDX_62a4b4c6becebfb576f08caf83" ON public.caomei_auth_oauth_refresh_token USING btree (token);
CREATE INDEX "IDX_1cf2681c8e104f4f008960e35a" ON public.caomei_auth_oauth_refresh_token USING btree (client_id);
CREATE INDEX "IDX_96a6a07954a0d94d48fe001173" ON public.caomei_auth_oauth_refresh_token USING btree (session_id);
CREATE INDEX "IDX_089bf8ffb36da54de18509e0b6" ON public.caomei_auth_oauth_refresh_token USING btree (user_id);
CREATE INDEX "IDX_e86ccb13bb91e92d29e0999a6a" ON public.caomei_auth_oauth_refresh_token USING btree (authorization_code_id);

-- public.caomei_auth_oauth_consent definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_consent;

CREATE TABLE public.caomei_auth_oauth_consent (
	id VARCHAR(36) NOT NULL PRIMARY KEY,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	client_id VARCHAR(191) NOT NULL,
	user_id VARCHAR(36) NULL,
	reference_id VARCHAR(191) NULL,
	resources TEXT NULL,
	requested_user_info_claims TEXT NULL,
	scopes TEXT NOT NULL
);

CREATE INDEX "IDX_8a0738a41dabfbf705c162bde1" ON public.caomei_auth_oauth_consent USING btree (client_id);
CREATE INDEX "IDX_5537b38a6c06bb652a341fa637" ON public.caomei_auth_oauth_consent USING btree (user_id);

-- public.caomei_auth_oauth_client_assertion definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_client_assertion;

CREATE TABLE public.caomei_auth_oauth_client_assertion (
	id VARCHAR(36) NOT NULL PRIMARY KEY,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	expires_at timestamp with time zone DEFAULT now() NOT NULL
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
	CONSTRAINT "PK_0a0af6fb921a4c466bc86ccdbe5" PRIMARY KEY (id),
	CONSTRAINT "FK_74025fdcaa5eb6e1da65ecd0bcb" FOREIGN KEY (user_id) REFERENCES public.caomei_auth_user(id) ON DELETE CASCADE,
	CONSTRAINT "FK_e01a03fbaf990eb8d81192ca5b2" FOREIGN KEY (impersonated_by) REFERENCES public.caomei_auth_user(id) ON DELETE SET NULL
);
CREATE INDEX "IDX_74025fdcaa5eb6e1da65ecd0bc" ON public.caomei_auth_session USING btree (user_id);
CREATE INDEX "IDX_d18c48fcaf48365c685ebba665" ON public.caomei_auth_session USING btree (token);


-- public.caomei_auth_sso_provider definition

-- Drop table

-- DROP TABLE public.caomei_auth_sso_provider;

CREATE TABLE public.caomei_auth_sso_provider (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	issuer text NOT NULL,
	domain varchar(255) NOT NULL,
	oidc_config text NULL,
	saml_config text NULL,
	provider_id varchar(128) NOT NULL,
	organization_id varchar(36) NULL,
	user_id varchar(36) NOT NULL,
	"name" varchar(255) NULL,
	description text NULL,
	enabled bool DEFAULT true NOT NULL,
	"type" varchar(32) DEFAULT 'oidc'::character varying NOT NULL,
	metadata_url text NULL,
	client_id varchar(255) NULL,
	client_secret text NULL,
	redirect_uri text NULL,
	scopes varchar(500) NULL,
	additional_config text NULL,
	CONSTRAINT "PK_sso_provider_id" PRIMARY KEY (id),
	CONSTRAINT "UQ_sso_provider_provider_id" UNIQUE (provider_id),
	CONSTRAINT "FK_sso_provider_user_id" FOREIGN KEY (user_id) REFERENCES public.caomei_auth_user(id) ON DELETE CASCADE
);
CREATE INDEX "IDX_sso_provider_issuer" ON public.caomei_auth_sso_provider USING btree (issuer);
CREATE INDEX "IDX_sso_provider_domain" ON public.caomei_auth_sso_provider USING btree (domain);
CREATE INDEX "IDX_sso_provider_provider_id" ON public.caomei_auth_sso_provider USING btree (provider_id);
CREATE INDEX "IDX_sso_provider_organization_id" ON public.caomei_auth_sso_provider USING btree (organization_id);


-- public.caomei_auth_jwks definition

-- Drop table

-- DROP TABLE public.caomei_auth_jwks;

CREATE TABLE public.caomei_auth_jwks (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	public_key text NOT NULL,
	private_key text NOT NULL,
	CONSTRAINT "PK_caomei_auth_jwks" PRIMARY KEY (id)
);
