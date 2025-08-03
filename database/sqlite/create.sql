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


-- 表：caomei_auth_oauth_access_token
-- DROP TABLE IF EXISTS caomei_auth_oauth_access_token;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_access_token (
    id                       VARCHAR (36) PRIMARY KEY
                                          NOT NULL,
    created_at               DATETIME     NOT NULL
                                          DEFAULT (datetime('now') ),
    updated_at               DATETIME     NOT NULL
                                          DEFAULT (datetime('now') ),
    access_token             TEXT         NOT NULL,
    refresh_token            TEXT,
    access_token_expires_at  DATETIME     NOT NULL,
    refresh_token_expires_at DATETIME,
    client_id                VARCHAR (36) NOT NULL,
    user_id                  VARCHAR (36) NOT NULL,
    scopes                   TEXT,
    CONSTRAINT FK_79dc2fd873300c86e710e1e5734 FOREIGN KEY (
        client_id
    )
    REFERENCES caomei_auth_oauth_application (id) ON DELETE CASCADE
                                                  ON UPDATE NO ACTION,
    CONSTRAINT FK_993218a00f98d6c01350c75c48a FOREIGN KEY (
        user_id
    )
    REFERENCES caomei_auth_user (id) ON DELETE CASCADE
                                     ON UPDATE NO ACTION
);


-- 表：caomei_auth_oauth_application
-- DROP TABLE IF EXISTS caomei_auth_oauth_application;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_application (
    id                         VARCHAR (36) PRIMARY KEY
                                            NOT NULL,
    created_at                 DATETIME     NOT NULL
                                            DEFAULT (datetime('now') ),
    updated_at                 DATETIME     NOT NULL
                                            DEFAULT (datetime('now') ),
    client_id                  TEXT         NOT NULL,
    client_secret              TEXT         NOT NULL,
    name                       TEXT         NOT NULL,
    redirect_ur_ls             TEXT         NOT NULL,
    metadata                   TEXT,
    type                       VARCHAR (32) NOT NULL,
    disabled                   BOOLEAN      NOT NULL
                                            DEFAULT (0),
    user_id                    VARCHAR (36),
    token_endpoint_auth_method VARCHAR (32) DEFAULT ('client_secret_basic'),
    grant_types                TEXT,
    response_types             TEXT,
    client_uri                 TEXT,
    logo_uri                   TEXT,
    scope                      TEXT,
    contacts                   TEXT,
    tos_uri                    TEXT,
    policy_uri                 TEXT,
    jwks_uri                   TEXT,
    jwks                       TEXT,
    software_id                VARCHAR (64),
    software_version           VARCHAR (32),
    software_statement         TEXT,
    description                TEXT,
    CONSTRAINT FK_e99bf1ea40294f87fef9d3e13b6 FOREIGN KEY (
        user_id
    )
    REFERENCES caomei_auth_user (id) ON DELETE CASCADE
                                     ON UPDATE NO ACTION
);


-- 表：caomei_auth_oauth_consent
-- DROP TABLE IF EXISTS caomei_auth_oauth_consent;

CREATE TABLE IF NOT EXISTS caomei_auth_oauth_consent (
    id            VARCHAR (36) PRIMARY KEY
                               NOT NULL,
    created_at    DATETIME     NOT NULL
                               DEFAULT (datetime('now') ),
    updated_at    DATETIME     NOT NULL
                               DEFAULT (datetime('now') ),
    user_id       VARCHAR (36) NOT NULL,
    client_id     VARCHAR (36) NOT NULL,
    scopes        TEXT,
    consent_given BOOLEAN      NOT NULL
                               DEFAULT (0),
    CONSTRAINT FK_8a0738a41dabfbf705c162bde1d FOREIGN KEY (
        client_id
    )
    REFERENCES caomei_auth_oauth_application (id) ON DELETE CASCADE
                                                  ON UPDATE NO ACTION,
    CONSTRAINT FK_5537b38a6c06bb652a341fa6370 FOREIGN KEY (
        user_id
    )
    REFERENCES caomei_auth_user (id) ON DELETE CASCADE
                                     ON UPDATE NO ACTION
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


-- 索引：IDX_5537b38a6c06bb652a341fa637
DROP INDEX IF EXISTS IDX_5537b38a6c06bb652a341fa637;

CREATE INDEX IF NOT EXISTS IDX_5537b38a6c06bb652a341fa637 ON caomei_auth_oauth_consent (
    "user_id"
);


-- 索引：IDX_64151152d3b06145934b2776db
DROP INDEX IF EXISTS IDX_64151152d3b06145934b2776db;

CREATE INDEX IF NOT EXISTS IDX_64151152d3b06145934b2776db ON caomei_auth_oauth_access_token (
    "access_token"
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


-- 索引：IDX_79dc2fd873300c86e710e1e573
DROP INDEX IF EXISTS IDX_79dc2fd873300c86e710e1e573;

CREATE INDEX IF NOT EXISTS IDX_79dc2fd873300c86e710e1e573 ON caomei_auth_oauth_access_token (
    "client_id"
);


-- 索引：IDX_8a0738a41dabfbf705c162bde1
DROP INDEX IF EXISTS IDX_8a0738a41dabfbf705c162bde1;

CREATE INDEX IF NOT EXISTS IDX_8a0738a41dabfbf705c162bde1 ON caomei_auth_oauth_consent (
    "client_id"
);


-- 索引：IDX_993218a00f98d6c01350c75c48
DROP INDEX IF EXISTS IDX_993218a00f98d6c01350c75c48;

CREATE INDEX IF NOT EXISTS IDX_993218a00f98d6c01350c75c48 ON caomei_auth_oauth_access_token (
    "user_id"
);


-- 索引：IDX_d18c48fcaf48365c685ebba665
DROP INDEX IF EXISTS IDX_d18c48fcaf48365c685ebba665;

CREATE INDEX IF NOT EXISTS IDX_d18c48fcaf48365c685ebba665 ON caomei_auth_session (
    "token"
);


-- 索引：IDX_de6b575c18d7b60ef79b62c9f9
DROP INDEX IF EXISTS IDX_de6b575c18d7b60ef79b62c9f9;

CREATE INDEX IF NOT EXISTS IDX_de6b575c18d7b60ef79b62c9f9 ON caomei_auth_oauth_access_token (
    "refresh_token"
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


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
