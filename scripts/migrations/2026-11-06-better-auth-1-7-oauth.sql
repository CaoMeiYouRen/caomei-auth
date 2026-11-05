-- ============================================================================
-- 2026-11-06 better-auth 1.7 OAuth Provider / 2FA 结构迁移（PostgreSQL）
--
-- 背景：
--   better-auth 1.6 → 1.7 重构了 OAuth Provider 的存储结构：
--   - oauth_access_token 的 access_token/refresh_token 拆分为 token + refresh_id，
--     refresh token 独立到 oauth_refresh_token；
--   - oauth_application 更名为 oauth_client，并新增多个列；
--   - oauth_consent 移除 consent_given，新增 reference_id/resources/requested_user_info_claims；
--   - 新增 oauth_client_resource / oauth_resource / oauth_client_assertion / jwks；
--   - two_factor 新增 verified / failed_verification_count / locked_until。
--
-- 原则：
--   1. 不删除任何业务数据；旧表整体移动到 legacy_better_auth_1_7_20261106 schema。
--   2. 令牌与 client secret 统一转换为 better-auth 1.7 的 SHA-256 base64url 哈希；
--      已经是 43 位 base64url 的值视为已哈希，保持不变（兼容 1.6 已哈希部署）。
--   3. 脚本可重复执行：已迁移的表/列会被跳过。
--
-- 执行前必须备份：
--   pg_dump -Fc -d <db> -f backup_before_1_7.dump
-- 执行：
--   psql -v ON_ERROR_STOP=1 -f 2026-11-06-better-auth-1-7-oauth.sql
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS legacy_better_auth_1_7_20261106;

-- ---------------------------------------------------------------------------
-- 0. 工具函数（仅当前会话）
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.sha256_b64url(value text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT rtrim(translate(encode(sha256(convert_to(value, 'UTF8')), 'base64'), '+/', '-_'), '=')
$$;

-- 32 位明文 → 哈希；43 位 base64url 视为已哈希
CREATE OR REPLACE FUNCTION pg_temp.ensure_hashed(value text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN value IS NULL OR value = '' THEN NULL
        WHEN value ~ '^[A-Za-z0-9_-]{43}$' THEN value
        ELSE pg_temp.sha256_b64url(value)
    END
$$;

CREATE OR REPLACE FUNCTION pg_temp.scope_array(value text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN coalesce(trim(value), '') = '' THEN '[]'
        ELSE to_json(regexp_split_to_array(trim(value), '\s+'))::text
    END
$$;

CREATE OR REPLACE FUNCTION pg_temp.csv_array(value text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN coalesce(trim(value), '') = '' THEN NULL
        ELSE to_json(regexp_split_to_array(trim(value), '\s*,\s*'))::text
    END
$$;

-- ---------------------------------------------------------------------------
-- 1. two_factor：补充 better-auth 1.7 字段
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.caomei_auth_two_factor
    ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS failed_verification_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone;

-- ---------------------------------------------------------------------------
-- 2. oauth_client：新建（若不存在）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caomei_auth_oauth_client (
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id character varying(191) NOT NULL,
    client_secret text,
    client_discovery_id character varying(191),
    disabled boolean DEFAULT false NOT NULL,
    skip_consent boolean,
    enable_end_session boolean,
    subject_type character varying(32),
    scopes text,
    client_credentials_scopes text,
    user_id character varying(36),
    name text,
    description text,
    uri text,
    icon text,
    contacts text,
    tos text,
    policy text,
    software_id character varying(64),
    software_version character varying(32),
    software_statement text,
    redirect_uris text NOT NULL,
    post_logout_redirect_uris text,
    backchannel_logout_uri text,
    backchannel_logout_session_required boolean,
    token_endpoint_auth_method character varying(32),
    application_type character varying(32),
    jwks text,
    jwks_uri text,
    grant_types text,
    response_types text,
    require_pkce boolean,
    dpop_bound_access_tokens boolean DEFAULT false NOT NULL,
    reference_id character varying(191),
    metadata text,
    CONSTRAINT "PK_aedd48e01d57a6e7725bca62615" PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_7e27963e79c7ec5cb46ecbd3e0"
    ON public.caomei_auth_oauth_client USING btree (client_id);
CREATE INDEX IF NOT EXISTS "IDX_ed96c8129eaa026b4141b92877"
    ON public.caomei_auth_oauth_client USING btree (user_id);

-- 从旧 oauth_application 复制，并保留原表到 legacy schema
DO $$
BEGIN
    IF to_regclass('public.caomei_auth_oauth_application') IS NOT NULL THEN
        INSERT INTO public.caomei_auth_oauth_client (
            id, created_at, updated_at, client_id, client_secret, disabled, user_id,
            name, description, uri, icon, contacts, tos, policy,
            software_id, software_version, software_statement, redirect_uris,
            token_endpoint_auth_method, application_type, jwks, jwks_uri,
            grant_types, response_types, scopes, metadata
        )
        SELECT
            a.id,
            a.created_at,
            a.updated_at,
            a.client_id,
            pg_temp.ensure_hashed(a.client_secret),
            coalesce(a.disabled, false),
            a.user_id,
            nullif(trim(a.name), ''),
            nullif(trim(a.description), ''),
            nullif(trim(a.client_uri), ''),
            nullif(trim(a.logo_uri), ''),
            pg_temp.csv_array(a.contacts),
            nullif(trim(a.tos_uri), ''),
            nullif(trim(a.policy_uri), ''),
            nullif(trim(a.software_id), ''),
            nullif(trim(a.software_version), ''),
            nullif(trim(a.software_statement), ''),
            coalesce(pg_temp.csv_array(a.redirect_ur_ls), '[]'),
            nullif(trim(a.token_endpoint_auth_method), ''),
            nullif(trim(a.type), ''),
            nullif(trim(a.jwks), ''),
            nullif(trim(a.jwks_uri), ''),
            pg_temp.csv_array(a.grant_types),
            pg_temp.csv_array(a.response_types),
            CASE
                WHEN coalesce(trim(a.scope), '') = '' THEN NULL
                ELSE to_json(regexp_split_to_array(trim(a.scope), '\s+'))::text
            END,
            nullif(trim(a.metadata), '')
        FROM public.caomei_auth_oauth_application a
        WHERE NOT EXISTS (
            SELECT 1 FROM public.caomei_auth_oauth_client c WHERE c.client_id = a.client_id
        );

        EXECUTE 'ALTER TABLE public.caomei_auth_oauth_application SET SCHEMA legacy_better_auth_1_7_20261106';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. oauth_refresh_token：新建
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caomei_auth_oauth_refresh_token (
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    token character varying(255) NOT NULL,
    client_id character varying(191) NOT NULL,
    session_id character varying(36),
    user_id character varying(36) NOT NULL,
    reference_id character varying(191),
    authorization_code_id character varying(191),
    resources text,
    requested_user_info_claims text,
    expires_at timestamp with time zone NOT NULL,
    revoked timestamp with time zone,
    rotated_at timestamp with time zone,
    rotation_replay_response text,
    rotation_replay_expires_at timestamp with time zone,
    auth_time timestamp with time zone,
    confirmation text,
    scopes text NOT NULL,
    CONSTRAINT "PK_6d08773ebce9cf00cca19d2d826" PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_62a4b4c6becebfb576f08caf83"
    ON public.caomei_auth_oauth_refresh_token USING btree (token);
CREATE INDEX IF NOT EXISTS "IDX_1cf2681c8e104f4f008960e35a"
    ON public.caomei_auth_oauth_refresh_token USING btree (client_id);
CREATE INDEX IF NOT EXISTS "IDX_96a6a07954a0d94d48fe001173"
    ON public.caomei_auth_oauth_refresh_token USING btree (session_id);
CREATE INDEX IF NOT EXISTS "IDX_089bf8ffb36da54de18509e0b6"
    ON public.caomei_auth_oauth_refresh_token USING btree (user_id);
CREATE INDEX IF NOT EXISTS "IDX_e86ccb13bb91e92d29e0999a6a"
    ON public.caomei_auth_oauth_refresh_token USING btree (authorization_code_id);

-- ---------------------------------------------------------------------------
-- 4. oauth_access_token：旧结构整体替换，数据迁移到新结构
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    has_token boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'caomei_auth_oauth_access_token'
          AND column_name = 'token'
    ) INTO has_token;

    IF to_regclass('public.caomei_auth_oauth_access_token') IS NOT NULL AND NOT has_token THEN
        EXECUTE 'ALTER TABLE public.caomei_auth_oauth_access_token SET SCHEMA legacy_better_auth_1_7_20261106';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.caomei_auth_oauth_access_token (
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    token character varying(255) NOT NULL,
    client_id character varying(191) NOT NULL,
    session_id character varying(36),
    user_id character varying(36),
    reference_id character varying(191),
    authorization_code_id character varying(191),
    resources text,
    requested_user_info_claims text,
    refresh_id character varying(36),
    expires_at timestamp with time zone NOT NULL,
    revoked timestamp with time zone,
    confirmation text,
    scopes text NOT NULL,
    CONSTRAINT "PK_9f0c527917a0691fa29d66dd185" PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_078f4bd43a276ea00117f6b5a7"
    ON public.caomei_auth_oauth_access_token USING btree (token);
CREATE INDEX IF NOT EXISTS "IDX_79dc2fd873300c86e710e1e573"
    ON public.caomei_auth_oauth_access_token USING btree (client_id);
CREATE INDEX IF NOT EXISTS "IDX_a204f51ebef92e5a0ac9abf81e"
    ON public.caomei_auth_oauth_access_token USING btree (session_id);
CREATE INDEX IF NOT EXISTS "IDX_993218a00f98d6c01350c75c48"
    ON public.caomei_auth_oauth_access_token USING btree (user_id);
CREATE INDEX IF NOT EXISTS "IDX_4884a51f27eebd700342707639"
    ON public.caomei_auth_oauth_access_token USING btree (authorization_code_id);
CREATE INDEX IF NOT EXISTS "IDX_0d00b3721ac96b0128088e83c6"
    ON public.caomei_auth_oauth_access_token USING btree (refresh_id);

DO $$
BEGIN
    IF to_regclass('legacy_better_auth_1_7_20261106.caomei_auth_oauth_access_token') IS NULL THEN
        RETURN;
    END IF;

    -- 4.1 旧行中的 refresh token 拆到独立表，使用旧行 id 保持可追溯
    INSERT INTO public.caomei_auth_oauth_refresh_token (
        id, created_at, updated_at, token, client_id, session_id, user_id,
        reference_id, authorization_code_id, resources, requested_user_info_claims,
        expires_at, revoked, rotated_at, rotation_replay_response,
        rotation_replay_expires_at, auth_time, confirmation, scopes
    )
    SELECT
        l.id,
        l.created_at,
        l.updated_at,
        pg_temp.ensure_hashed(l.refresh_token),
        l.client_id,
        NULL,
        l.user_id,
        NULL, NULL, NULL, NULL,
        coalesce(l.refresh_token_expires_at, l.created_at + interval '7 days'),
        NULL, NULL, NULL, NULL, NULL, NULL,
        pg_temp.scope_array(l.scopes)
    FROM legacy_better_auth_1_7_20261106.caomei_auth_oauth_access_token l
    WHERE l.refresh_token IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- 4.2 access token 迁移；refresh_id 指向 4.1 生成的 refresh 行
    INSERT INTO public.caomei_auth_oauth_access_token (
        id, created_at, updated_at, token, client_id, session_id, user_id,
        reference_id, authorization_code_id, resources, requested_user_info_claims,
        refresh_id, expires_at, revoked, confirmation, scopes
    )
    SELECT
        l.id,
        l.created_at,
        l.updated_at,
        pg_temp.ensure_hashed(l.access_token),
        l.client_id,
        NULL,
        l.user_id,
        NULL, NULL, NULL, NULL,
        CASE WHEN l.refresh_token IS NOT NULL THEN l.id ELSE NULL END,
        l.access_token_expires_at,
        NULL, NULL,
        pg_temp.scope_array(l.scopes)
    FROM legacy_better_auth_1_7_20261106.caomei_auth_oauth_access_token l
    ON CONFLICT DO NOTHING;
END $$;

-- ---------------------------------------------------------------------------
-- 5. oauth_consent：旧结构整体替换
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    has_consent_given boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'caomei_auth_oauth_consent'
          AND column_name = 'consent_given'
    ) INTO has_consent_given;

    IF to_regclass('public.caomei_auth_oauth_consent') IS NOT NULL AND has_consent_given THEN
        EXECUTE 'ALTER TABLE public.caomei_auth_oauth_consent SET SCHEMA legacy_better_auth_1_7_20261106';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.caomei_auth_oauth_consent (
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id character varying(191) NOT NULL,
    user_id character varying(36),
    reference_id character varying(191),
    resources text,
    requested_user_info_claims text,
    scopes text NOT NULL,
    CONSTRAINT "PK_84bb78ae62c5414b679728f5000" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_8a0738a41dabfbf705c162bde1"
    ON public.caomei_auth_oauth_consent USING btree (client_id);
CREATE INDEX IF NOT EXISTS "IDX_5537b38a6c06bb652a341fa637"
    ON public.caomei_auth_oauth_consent USING btree (user_id);

DO $$
BEGIN
    IF to_regclass('legacy_better_auth_1_7_20261106.caomei_auth_oauth_consent') IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO public.caomei_auth_oauth_consent (
        id, created_at, updated_at, client_id, user_id, reference_id,
        resources, requested_user_info_claims, scopes
    )
    SELECT
        l.id,
        l.created_at,
        l.updated_at,
        l.client_id,
        l.user_id,
        NULL, NULL, NULL,
        pg_temp.scope_array(l.scopes)
    FROM legacy_better_auth_1_7_20261106.caomei_auth_oauth_consent l
    ON CONFLICT (id) DO NOTHING;
END $$;

-- ---------------------------------------------------------------------------
-- 6. 其余 better-auth 1.7 新表
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caomei_auth_oauth_client_resource (
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id character varying(191) NOT NULL,
    resource_id character varying(512) NOT NULL,
    metadata text,
    CONSTRAINT "PK_9d10ebc7fec6e2c387969c3880e" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_66d910ee583421b58c74f76d34"
    ON public.caomei_auth_oauth_client_resource USING btree (client_id);
CREATE INDEX IF NOT EXISTS "IDX_8a12fed2128cad8405547cd132"
    ON public.caomei_auth_oauth_client_resource USING btree (resource_id);
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_16f4c39e99d3b2619a4e92992c"
    ON public.caomei_auth_oauth_client_resource USING btree (client_id, resource_id);

CREATE TABLE IF NOT EXISTS public.caomei_auth_oauth_resource (
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    identifier character varying(768) NOT NULL,
    name text NOT NULL,
    access_token_ttl integer,
    refresh_token_ttl integer,
    signing_algorithm character varying(32),
    signing_key_id character varying(191),
    allowed_scopes text,
    custom_claims text,
    dpop_bound_access_tokens_required boolean DEFAULT false NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    policy_version integer DEFAULT 1 NOT NULL,
    metadata text,
    CONSTRAINT "PK_bda2a1ed3bd6cf85f000cc2258f" PRIMARY KEY (id),
    CONSTRAINT "UQ_63b7a3234cb7e761bb8ec431178" UNIQUE (identifier)
);

CREATE TABLE IF NOT EXISTS public.caomei_auth_oauth_client_assertion (
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT "PK_f02bd070eeb16df399053b4b7f8" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.caomei_auth_jwks (
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    public_key text NOT NULL,
    private_key text NOT NULL,
    CONSTRAINT "PK_e35d31d8f511e40490a4998fb10" PRIMARY KEY (id)
);

COMMIT;

-- 迁移完成后：
--   1. 重新部署并验证登录、2FA、OAuth 授权、back-channel logout。
--   2. 确认无误后再决定是否删除 legacy_better_auth_1_7_20261106：
--      DROP SCHEMA legacy_better_auth_1_7_20261106 CASCADE;
