--
-- 所用的文本编码：UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- 表：caomei_auth_account
DROP TABLE IF EXISTS caomei_auth_account;

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
    password                 TEXT
);


-- 表：caomei_auth_session
DROP TABLE IF EXISTS caomei_auth_session;

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
    impersonated_by VARCHAR (36)
);


-- 表：caomei_auth_user
DROP TABLE IF EXISTS caomei_auth_user;

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
    ban_expires           INTEGER
);


-- 表：caomei_auth_verification
DROP TABLE IF EXISTS caomei_auth_verification;

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


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
