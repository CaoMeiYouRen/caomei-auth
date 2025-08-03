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


-- public.caomei_auth_oauth_application definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_application;

CREATE TABLE public.caomei_auth_oauth_application (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	client_id text NOT NULL,
	client_secret text NOT NULL,
	"name" text NOT NULL,
	redirect_ur_ls text NOT NULL,
	metadata text NULL,
	"type" varchar(32) NOT NULL,
	disabled bool DEFAULT false NOT NULL,
	user_id varchar(36) NULL,
	description text NULL,
	token_endpoint_auth_method varchar(32) DEFAULT 'client_secret_basic'::character varying NULL,
	grant_types text NULL,
	response_types text NULL,
	client_uri text NULL,
	logo_uri text NULL,
	"scope" text NULL,
	contacts text NULL,
	tos_uri text NULL,
	policy_uri text NULL,
	jwks_uri text NULL,
	jwks text NULL,
	software_id varchar(64) NULL,
	software_version varchar(32) NULL,
	software_statement text NULL,
	CONSTRAINT "PK_c3d0590a580a761b8e4da8dd12c" PRIMARY KEY (id),
	CONSTRAINT "FK_e99bf1ea40294f87fef9d3e13b6" FOREIGN KEY (user_id) REFERENCES public.caomei_auth_user(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX "IDX_dee3adb9afb19035fe52c3fd32" ON public.caomei_auth_oauth_application USING btree (client_id);
CREATE INDEX "IDX_e99bf1ea40294f87fef9d3e13b" ON public.caomei_auth_oauth_application USING btree (user_id);


-- public.caomei_auth_oauth_consent definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_consent;

CREATE TABLE public.caomei_auth_oauth_consent (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	user_id varchar(36) NOT NULL,
	client_id varchar(36) NOT NULL,
	scopes text NULL,
	consent_given bool DEFAULT false NOT NULL,
	CONSTRAINT "PK_84bb78ae62c5414b679728f5000" PRIMARY KEY (id),
	CONSTRAINT "FK_5537b38a6c06bb652a341fa6370" FOREIGN KEY (user_id) REFERENCES public.caomei_auth_user(id) ON DELETE CASCADE,
	CONSTRAINT "FK_8a0738a41dabfbf705c162bde1d" FOREIGN KEY (client_id) REFERENCES public.caomei_auth_oauth_application(id) ON DELETE CASCADE
);
CREATE INDEX "IDX_5537b38a6c06bb652a341fa637" ON public.caomei_auth_oauth_consent USING btree (user_id);
CREATE INDEX "IDX_8a0738a41dabfbf705c162bde1" ON public.caomei_auth_oauth_consent USING btree (client_id);


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


-- public.caomei_auth_oauth_access_token definition

-- Drop table

-- DROP TABLE public.caomei_auth_oauth_access_token;

CREATE TABLE public.caomei_auth_oauth_access_token (
	id varchar(36) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	access_token text NOT NULL,
	refresh_token text NULL,
	access_token_expires_at timestamptz NOT NULL,
	refresh_token_expires_at timestamptz NULL,
	client_id varchar(36) NOT NULL,
	user_id varchar(36) NOT NULL,
	scopes text NULL,
	CONSTRAINT "PK_9f0c527917a0691fa29d66dd185" PRIMARY KEY (id),
	CONSTRAINT "FK_79dc2fd873300c86e710e1e5734" FOREIGN KEY (client_id) REFERENCES public.caomei_auth_oauth_application(id) ON DELETE CASCADE,
	CONSTRAINT "FK_993218a00f98d6c01350c75c48a" FOREIGN KEY (user_id) REFERENCES public.caomei_auth_user(id) ON DELETE CASCADE
);
CREATE INDEX "IDX_64151152d3b06145934b2776db" ON public.caomei_auth_oauth_access_token USING btree (access_token);
CREATE INDEX "IDX_79dc2fd873300c86e710e1e573" ON public.caomei_auth_oauth_access_token USING btree (client_id);
CREATE INDEX "IDX_993218a00f98d6c01350c75c48" ON public.caomei_auth_oauth_access_token USING btree (user_id);
CREATE INDEX "IDX_de6b575c18d7b60ef79b62c9f9" ON public.caomei_auth_oauth_access_token USING btree (refresh_token);


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
