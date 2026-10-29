--
-- SQLiteStudio v3.4.12 生成的文件，周五 7月 25 22:40:28 2025
--
-- 所用的文本编码：UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- 表：caomei_auth_account
-- DROP TABLE IF EXISTS caomei_auth_account;

CREATE TABLE IF NOT EXISTS caomei_auth_account (
    id                       VARCHAR (36) PRIMARY KEY
                                          NOT NULL,
    created_at               DATETIME     NOT NULL
                                          DEFAULT (datetime('now') ),
    updated_at               DATETIME     NOT NULL
                                          DEFAULT (datetime('now') ),
    account_id               TEXT         NOT NULL,
    provider_id              TEXT         NOT NULL,
    user_id                  VARCHAR (36) NOT NULL,
    access_token             TEXT,
    refresh_token            TEXT,
    id_token                 TEXT,
    access_token_expires_at  DATETIME,
    refresh_token_expires_at DATETIME,
    scope                    TEXT,
    password                 TEXT,
    CONSTRAINT FK_6415e014be607f933d913962c95 FOREIGN KEY (
        user_id
    )
    REFERENCES caomei_auth_user (id) ON DELETE CASCADE
                                     ON UPDATE NO ACTION
);


-- 表：caomei_auth_oauth_client
-- DROP TABLE IF EXISTS caomei_auth_oauth_client;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_client (
    id                                  VARCHAR(36) PRIMARY KEY NOT NULL,
    created_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    updated_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    client_id                           VARCHAR(191) NOT NULL,
    client_secret                       TEXT,
    client_discovery_id                 VARCHAR(191),
    disabled                            BOOLEAN NOT NULL DEFAULT 0,
    skip_consent                        BOOLEAN,
    enable_end_session                  BOOLEAN,
    subject_type                        VARCHAR(32),
    scopes                              TEXT,
    client_credentials_scopes           TEXT,
    user_id                             VARCHAR(36),
    name                                TEXT,
    description                         TEXT,
    uri                                 TEXT,
    icon                                TEXT,
    contacts                            TEXT,
    tos                                 TEXT,
    policy                              TEXT,
    software_id                         VARCHAR(64),
    software_version                    VARCHAR(32),
    software_statement                  TEXT,
    redirect_uris                       TEXT NOT NULL,
    post_logout_redirect_uris           TEXT,
    backchannel_logout_uri              TEXT,
    backchannel_logout_session_required BOOLEAN,
    token_endpoint_auth_method          VARCHAR(32),
    application_type                    VARCHAR(32),
    jwks                                TEXT,
    jwks_uri                            TEXT,
    grant_types                         TEXT,
    response_types                      TEXT,
    require_pkce                        BOOLEAN,
    dpop_bound_access_tokens            BOOLEAN NOT NULL DEFAULT 0,
    reference_id                        VARCHAR(191),
    metadata                            TEXT
);


-- 表：caomei_auth_oauth_resource
-- DROP TABLE IF EXISTS caomei_auth_oauth_resource;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_resource (
    id                                  VARCHAR(36) PRIMARY KEY NOT NULL,
    created_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    updated_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    identifier                          VARCHAR(768) NOT NULL,
    name                                TEXT NOT NULL,
    access_token_ttl                    INTEGER,
    refresh_token_ttl                   INTEGER,
    signing_algorithm                   VARCHAR(32),
    signing_key_id                      VARCHAR(191),
    allowed_scopes                      TEXT,
    custom_claims                       TEXT,
    dpop_bound_access_tokens_required   BOOLEAN NOT NULL DEFAULT 0,
    disabled                            BOOLEAN NOT NULL DEFAULT 0,
    policy_version                      INTEGER NOT NULL DEFAULT 1,
    metadata                            TEXT
);


-- 表：caomei_auth_oauth_client_resource
-- DROP TABLE IF EXISTS caomei_auth_oauth_client_resource;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_client_resource (
    id                                  VARCHAR(36) PRIMARY KEY NOT NULL,
    created_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    updated_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    client_id                           VARCHAR(191) NOT NULL,
    resource_id                         VARCHAR(512) NOT NULL,
    metadata                            TEXT,
    UNIQUE (client_id, resource_id)
);


-- 表：caomei_auth_oauth_access_token
-- DROP TABLE IF EXISTS caomei_auth_oauth_access_token;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_access_token (
    id                                  VARCHAR(36) PRIMARY KEY NOT NULL,
    created_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    updated_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    token                               VARCHAR(255) NOT NULL,
    client_id                           VARCHAR(191) NOT NULL,
    session_id                          VARCHAR(36),
    user_id                             VARCHAR(36),
    reference_id                        VARCHAR(191),
    authorization_code_id               VARCHAR(191),
    resources                           TEXT,
    requested_user_info_claims          TEXT,
    refresh_id                          VARCHAR(36),
    expires_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    revoked                             DATETIME,
    confirmation                        TEXT,
    scopes                              TEXT NOT NULL
);


-- 表：caomei_auth_oauth_refresh_token
-- DROP TABLE IF EXISTS caomei_auth_oauth_refresh_token;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_refresh_token (
    id                                  VARCHAR(36) PRIMARY KEY NOT NULL,
    created_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    updated_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    token                               VARCHAR(255) NOT NULL,
    client_id                           VARCHAR(191) NOT NULL,
    session_id                          VARCHAR(36),
    user_id                             VARCHAR(36) NOT NULL,
    reference_id                        VARCHAR(191),
    authorization_code_id               VARCHAR(191),
    resources                           TEXT,
    requested_user_info_claims          TEXT,
    expires_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    revoked                             DATETIME,
    rotated_at                          DATETIME,
    rotation_replay_response            TEXT,
    rotation_replay_expires_at          DATETIME,
    auth_time                           DATETIME,
    confirmation                        TEXT,
    scopes                              TEXT NOT NULL
);


-- 表：caomei_auth_oauth_consent
-- DROP TABLE IF EXISTS caomei_auth_oauth_consent;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_consent (
    id                                  VARCHAR(36) PRIMARY KEY NOT NULL,
    created_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    updated_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    client_id                           VARCHAR(191) NOT NULL,
    user_id                             VARCHAR(36),
    reference_id                        VARCHAR(191),
    resources                           TEXT,
    requested_user_info_claims          TEXT,
    scopes                              TEXT NOT NULL
);


-- 表：caomei_auth_oauth_client_assertion
-- DROP TABLE IF EXISTS caomei_auth_oauth_client_assertion;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_client_assertion (
    id                                  VARCHAR(36) PRIMARY KEY NOT NULL,
    created_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    updated_at                          DATETIME NOT NULL DEFAULT (datetime('now') ),
    expires_at                          DATETIME NOT NULL DEFAULT (datetime('now') )
);


-- 表：caomei_auth_session
-- DROP TABLE IF EXISTS caomei_auth_session;

CREATE TABLE IF NOT EXISTS caomei_auth_session (
    id              VARCHAR (36) PRIMARY KEY
                                 NOT NULL,
    created_at      DATETIME     NOT NULL
                                 DEFAULT (datetime('now') ),
    updated_at      DATETIME     NOT NULL
                                 DEFAULT (datetime('now') ),
    expires_at      DATETIME     NOT NULL,
    token           TEXT         NOT NULL,
    ip_address      TEXT,
    user_agent      TEXT,
    user_id         VARCHAR (36) NOT NULL,
    impersonated_by VARCHAR (36),
    CONSTRAINT FK_74025fdcaa5eb6e1da65ecd0bcb FOREIGN KEY (
        user_id
    )
    REFERENCES caomei_auth_user (id) ON DELETE CASCADE
                                     ON UPDATE NO ACTION,
    CONSTRAINT FK_e01a03fbaf990eb8d81192ca5b2 FOREIGN KEY (
        impersonated_by
    )
    REFERENCES caomei_auth_user (id) ON DELETE SET NULL
                                     ON UPDATE NO ACTION
);


-- 表：caomei_auth_two_factor
-- DROP TABLE IF EXISTS caomei_auth_two_factor;

CREATE TABLE IF NOT EXISTS caomei_auth_two_factor (
    id           VARCHAR (36) PRIMARY KEY
                              NOT NULL,
    created_at   DATETIME     NOT NULL
                              DEFAULT (datetime('now') ),
    updated_at   DATETIME     NOT NULL
                              DEFAULT (datetime('now') ),
    user_id      VARCHAR (36) NOT NULL,
    secret       TEXT         NOT NULL,
    backup_codes TEXT,
    CONSTRAINT UQ_4916ed9f34f6e9e0a0cfb89a752 UNIQUE (
        user_id
    ),
    CONSTRAINT FK_ed7df12901fcf60dc40654dc47a FOREIGN KEY (
        user_id
    )
    REFERENCES caomei_auth_user (id) ON DELETE CASCADE
                                     ON UPDATE NO ACTION
);


-- 表：caomei_auth_user
-- DROP TABLE IF EXISTS caomei_auth_user;

CREATE TABLE IF NOT EXISTS caomei_auth_user (
    id                    VARCHAR (36)  PRIMARY KEY
                                        NOT NULL,
    created_at            DATETIME      NOT NULL
                                        DEFAULT (datetime('now') ),
    updated_at            DATETIME      NOT NULL
                                        DEFAULT (datetime('now') ),
    name                  TEXT          NOT NULL,
    email                 VARCHAR (255) NOT NULL,
    email_verified        BOOLEAN       NOT NULL
                                        DEFAULT (0),
    image                 TEXT,
    username              VARCHAR (128),
    display_username      VARCHAR (128),
    is_anonymous          BOOLEAN       NOT NULL
                                        DEFAULT (0),
    phone_number          VARCHAR (64),
    phone_number_verified BOOLEAN       NOT NULL
                                        DEFAULT (0),
    role                  VARCHAR (32)  DEFAULT ('user'),
    banned                BOOLEAN       NOT NULL
                                        DEFAULT (0),
    ban_reason            TEXT,
    ban_expires           INTEGER,
    two_factor_enabled    BOOLEAN       NOT NULL
                                        DEFAULT (0)
);


-- 表：caomei_auth_verification
-- DROP TABLE IF EXISTS caomei_auth_verification;

CREATE TABLE IF NOT EXISTS caomei_auth_verification (
    id         VARCHAR (36) PRIMARY KEY
                            NOT NULL,
    created_at DATETIME     NOT NULL
                            DEFAULT (datetime('now') ),
    updated_at DATETIME     NOT NULL
                            DEFAULT (datetime('now') ),
    identifier TEXT         NOT NULL,
    value      TEXT         NOT NULL,
    expires_at DATETIME     NOT NULL
);


-- 表：caomei_auth_sso_provider
-- DROP TABLE IF EXISTS caomei_auth_sso_provider;

CREATE TABLE IF NOT EXISTS caomei_auth_sso_provider (
    id               VARCHAR (36) PRIMARY KEY
                                  NOT NULL,
    created_at       DATETIME     NOT NULL
                                  DEFAULT (datetime('now') ),
    updated_at       DATETIME     NOT NULL
                                  DEFAULT (datetime('now') ),
    issuer           TEXT         NOT NULL,
    domain           VARCHAR (255) NOT NULL,
    oidc_config      TEXT,
    saml_config      TEXT,
    provider_id      VARCHAR (128) NOT NULL
                                  UNIQUE,
    organization_id  VARCHAR (36),
    user_id          VARCHAR (36) NOT NULL,
    name             VARCHAR (255),
    description      TEXT,
    enabled          BOOLEAN      NOT NULL
                                  DEFAULT (1),
    type             VARCHAR (32) NOT NULL
                                  DEFAULT ('oidc'),
    metadata_url     TEXT,
    client_id        VARCHAR (255),
    client_secret    TEXT,
    redirect_uri     TEXT,
    scopes           VARCHAR (500),
    additional_config TEXT,
    CONSTRAINT FK_sso_provider_user_id FOREIGN KEY (
        user_id
    )
    REFERENCES caomei_auth_user (id) ON DELETE CASCADE
                                     ON UPDATE NO ACTION
);


-- 表：caomei_auth_jwks
-- DROP TABLE IF EXISTS caomei_auth_jwks;

CREATE TABLE IF NOT EXISTS caomei_auth_jwks (
    id         VARCHAR (36) PRIMARY KEY
                            NOT NULL,
    created_at DATETIME     NOT NULL
                            DEFAULT (datetime('now') ),
    updated_at DATETIME     NOT NULL
                            DEFAULT (datetime('now') ),
    public_key TEXT         NOT NULL,
    private_key TEXT        NOT NULL
);


-- 索引：IDX_6415e014be607f933d913962c9
DROP INDEX IF EXISTS IDX_6415e014be607f933d913962c9;

CREATE INDEX IF NOT EXISTS IDX_6415e014be607f933d913962c9 ON caomei_auth_account (
    "user_id"
);


-- 索引：IDX_74025fdcaa5eb6e1da65ecd0bc
DROP INDEX IF EXISTS IDX_74025fdcaa5eb6e1da65ecd0bc;

CREATE INDEX IF NOT EXISTS IDX_74025fdcaa5eb6e1da65ecd0bc ON caomei_auth_session (
    "user_id"
);


-- 索引：IDX_d18c48fcaf48365c685ebba665
DROP INDEX IF EXISTS IDX_d18c48fcaf48365c685ebba665;

CREATE INDEX IF NOT EXISTS IDX_d18c48fcaf48365c685ebba665 ON caomei_auth_session (
    "token"
);


-- 索引：IDX_ed7df12901fcf60dc40654dc47
DROP INDEX IF EXISTS IDX_ed7df12901fcf60dc40654dc47;

CREATE INDEX IF NOT EXISTS IDX_ed7df12901fcf60dc40654dc47 ON caomei_auth_two_factor (
    "user_id"
);


-- 索引：IDX_sso_provider_issuer
DROP INDEX IF EXISTS IDX_sso_provider_issuer;

CREATE INDEX IF NOT EXISTS IDX_sso_provider_issuer ON caomei_auth_sso_provider (
    "issuer"
);


-- 索引：IDX_sso_provider_domain
DROP INDEX IF EXISTS IDX_sso_provider_domain;

CREATE INDEX IF NOT EXISTS IDX_sso_provider_domain ON caomei_auth_sso_provider (
    "domain"
);


-- 索引：IDX_sso_provider_provider_id
DROP INDEX IF EXISTS IDX_sso_provider_provider_id;

CREATE INDEX IF NOT EXISTS IDX_sso_provider_provider_id ON caomei_auth_sso_provider (
    "provider_id"
);


-- 索引：IDX_sso_provider_organization_id
DROP INDEX IF EXISTS IDX_sso_provider_organization_id;

CREATE INDEX IF NOT EXISTS IDX_sso_provider_organization_id ON caomei_auth_sso_provider (
    "organization_id"
);


-- 索引：IDX_sso_provider_user_id
DROP INDEX IF EXISTS IDX_sso_provider_user_id;

CREATE INDEX IF NOT EXISTS IDX_sso_provider_user_id ON caomei_auth_sso_provider (
    "user_id"
);


-- 索引：IDX_7e27963e79c7ec5cb46ecbd3e0
DROP INDEX IF EXISTS IDX_7e27963e79c7ec5cb46ecbd3e0;

CREATE UNIQUE INDEX IF NOT EXISTS IDX_7e27963e79c7ec5cb46ecbd3e0 ON caomei_auth_oauth_client (
    "client_id"
);


-- 索引：IDX_ed96c8129eaa026b4141b92877
DROP INDEX IF EXISTS IDX_ed96c8129eaa026b4141b92877;

CREATE INDEX IF NOT EXISTS IDX_ed96c8129eaa026b4141b92877 ON caomei_auth_oauth_client (
    "user_id"
);


-- 索引：undefined
DROP INDEX IF EXISTS undefined;

CREATE UNIQUE INDEX IF NOT EXISTS undefined ON caomei_auth_oauth_resource (
    "identifier"
);


-- 索引：IDX_66d910ee583421b58c74f76d34
DROP INDEX IF EXISTS IDX_66d910ee583421b58c74f76d34;

CREATE INDEX IF NOT EXISTS IDX_66d910ee583421b58c74f76d34 ON caomei_auth_oauth_client_resource (
    "client_id"
);


-- 索引：IDX_8a12fed2128cad8405547cd132
DROP INDEX IF EXISTS IDX_8a12fed2128cad8405547cd132;

CREATE INDEX IF NOT EXISTS IDX_8a12fed2128cad8405547cd132 ON caomei_auth_oauth_client_resource (
    "resource_id"
);


-- 索引：IDX_078f4bd43a276ea00117f6b5a7
DROP INDEX IF EXISTS IDX_078f4bd43a276ea00117f6b5a7;

CREATE UNIQUE INDEX IF NOT EXISTS IDX_078f4bd43a276ea00117f6b5a7 ON caomei_auth_oauth_access_token (
    "token"
);


-- 索引：IDX_79dc2fd873300c86e710e1e573
DROP INDEX IF EXISTS IDX_79dc2fd873300c86e710e1e573;

CREATE INDEX IF NOT EXISTS IDX_79dc2fd873300c86e710e1e573 ON caomei_auth_oauth_access_token (
    "client_id"
);


-- 索引：IDX_a204f51ebef92e5a0ac9abf81e
DROP INDEX IF EXISTS IDX_a204f51ebef92e5a0ac9abf81e;

CREATE INDEX IF NOT EXISTS IDX_a204f51ebef92e5a0ac9abf81e ON caomei_auth_oauth_access_token (
    "session_id"
);


-- 索引：IDX_993218a00f98d6c01350c75c48
DROP INDEX IF EXISTS IDX_993218a00f98d6c01350c75c48;

CREATE INDEX IF NOT EXISTS IDX_993218a00f98d6c01350c75c48 ON caomei_auth_oauth_access_token (
    "user_id"
);


-- 索引：IDX_4884a51f27eebd700342707639
DROP INDEX IF EXISTS IDX_4884a51f27eebd700342707639;

CREATE INDEX IF NOT EXISTS IDX_4884a51f27eebd700342707639 ON caomei_auth_oauth_access_token (
    "authorization_code_id"
);


-- 索引：IDX_0d00b3721ac96b0128088e83c6
DROP INDEX IF EXISTS IDX_0d00b3721ac96b0128088e83c6;

CREATE INDEX IF NOT EXISTS IDX_0d00b3721ac96b0128088e83c6 ON caomei_auth_oauth_access_token (
    "refresh_id"
);


-- 索引：IDX_62a4b4c6becebfb576f08caf83
DROP INDEX IF EXISTS IDX_62a4b4c6becebfb576f08caf83;

CREATE UNIQUE INDEX IF NOT EXISTS IDX_62a4b4c6becebfb576f08caf83 ON caomei_auth_oauth_refresh_token (
    "token"
);


-- 索引：IDX_1cf2681c8e104f4f008960e35a
DROP INDEX IF EXISTS IDX_1cf2681c8e104f4f008960e35a;

CREATE INDEX IF NOT EXISTS IDX_1cf2681c8e104f4f008960e35a ON caomei_auth_oauth_refresh_token (
    "client_id"
);


-- 索引：IDX_96a6a07954a0d94d48fe001173
DROP INDEX IF EXISTS IDX_96a6a07954a0d94d48fe001173;

CREATE INDEX IF NOT EXISTS IDX_96a6a07954a0d94d48fe001173 ON caomei_auth_oauth_refresh_token (
    "session_id"
);


-- 索引：IDX_089bf8ffb36da54de18509e0b6
DROP INDEX IF EXISTS IDX_089bf8ffb36da54de18509e0b6;

CREATE INDEX IF NOT EXISTS IDX_089bf8ffb36da54de18509e0b6 ON caomei_auth_oauth_refresh_token (
    "user_id"
);


-- 索引：IDX_e86ccb13bb91e92d29e0999a6a
DROP INDEX IF EXISTS IDX_e86ccb13bb91e92d29e0999a6a;

CREATE INDEX IF NOT EXISTS IDX_e86ccb13bb91e92d29e0999a6a ON caomei_auth_oauth_refresh_token (
    "authorization_code_id"
);


-- 索引：IDX_8a0738a41dabfbf705c162bde1
DROP INDEX IF EXISTS IDX_8a0738a41dabfbf705c162bde1;

CREATE INDEX IF NOT EXISTS IDX_8a0738a41dabfbf705c162bde1 ON caomei_auth_oauth_consent (
    "client_id"
);


-- 索引：IDX_5537b38a6c06bb652a341fa637
DROP INDEX IF EXISTS IDX_5537b38a6c06bb652a341fa637;

CREATE INDEX IF NOT EXISTS IDX_5537b38a6c06bb652a341fa637 ON caomei_auth_oauth_consent (
    "user_id"
);


-- 索引：IDX_16f4c39e99d3b2619a4e92992c
DROP INDEX IF EXISTS IDX_16f4c39e99d3b2619a4e92992c;

CREATE UNIQUE INDEX IF NOT EXISTS IDX_16f4c39e99d3b2619a4e92992c ON caomei_auth_oauth_client_resource (
    "client_id",
    "resource_id"
);


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
