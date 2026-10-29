-- MySQL 数据库创建脚本
-- 生成时间: 2025年7月25日
-- 编码: UTF-8

SET FOREIGN_KEY_CHECKS = 0;

-- 表: caomei_auth_user
DROP TABLE IF EXISTS `caomei_auth_user`;

CREATE TABLE `caomei_auth_user` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `name` TEXT NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `image` TEXT NULL,
    `username` VARCHAR(128) NULL,
    `display_username` VARCHAR(128) NULL,
    `is_anonymous` BOOLEAN NOT NULL DEFAULT FALSE,
    `phone_number` VARCHAR(64) NULL,
    `phone_number_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `role` VARCHAR(32) DEFAULT 'user',
    `banned` BOOLEAN NOT NULL DEFAULT FALSE,
    `ban_reason` TEXT NULL,
    `ban_expires` INT NULL,
    `two_factor_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`id`),
    UNIQUE KEY `IDX_eaed40cc28f3c6cdcfdfbfea9c` (`email`),
    UNIQUE KEY `IDX_fd9926712ead987f3ccb24744c` (`username`),
    UNIQUE KEY `IDX_7de537c03bf5bbe41219f4f2e2` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_account
DROP TABLE IF EXISTS `caomei_auth_account`;

CREATE TABLE `caomei_auth_account` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `account_id` TEXT NOT NULL,
    `provider_id` TEXT NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `access_token` TEXT NULL,
    `refresh_token` TEXT NULL,
    `id_token` TEXT NULL,
    `access_token_expires_at` TIMESTAMP NULL,
    `refresh_token_expires_at` TIMESTAMP NULL,
    `scope` TEXT NULL,
    `password` TEXT NULL,
    PRIMARY KEY (`id`),
    KEY `IDX_6415e014be607f933d913962c9` (`user_id`),
    CONSTRAINT `FK_6415e014be607f933d913962c95` FOREIGN KEY (`user_id`) REFERENCES `caomei_auth_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_oauth_client
DROP TABLE IF EXISTS `caomei_auth_oauth_client`;

CREATE TABLE `caomei_auth_oauth_client` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `client_id` VARCHAR(191) NOT NULL,
    `client_secret` TEXT NULL,
    `client_discovery_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT 0,
    `skip_consent` BOOLEAN NULL,
    `enable_end_session` BOOLEAN NULL,
    `subject_type` VARCHAR(32) NULL,
    `scopes` TEXT NULL,
    `client_credentials_scopes` TEXT NULL,
    `user_id` VARCHAR(36) NULL,
    `name` TEXT NULL,
    `description` TEXT NULL,
    `uri` TEXT NULL,
    `icon` TEXT NULL,
    `contacts` TEXT NULL,
    `tos` TEXT NULL,
    `policy` TEXT NULL,
    `software_id` VARCHAR(64) NULL,
    `software_version` VARCHAR(32) NULL,
    `software_statement` TEXT NULL,
    `redirect_uris` TEXT NOT NULL,
    `post_logout_redirect_uris` TEXT NULL,
    `backchannel_logout_uri` TEXT NULL,
    `backchannel_logout_session_required` BOOLEAN NULL,
    `token_endpoint_auth_method` VARCHAR(32) NULL,
    `application_type` VARCHAR(32) NULL,
    `jwks` TEXT NULL,
    `jwks_uri` TEXT NULL,
    `grant_types` TEXT NULL,
    `response_types` TEXT NULL,
    `require_pkce` BOOLEAN NULL,
    `dpop_bound_access_tokens` BOOLEAN NOT NULL DEFAULT 0,
    `reference_id` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    UNIQUE KEY `IDX_7e27963e79c7ec5cb46ecbd3e0` (`client_id`),
    KEY `IDX_ed96c8129eaa026b4141b92877` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_oauth_resource
DROP TABLE IF EXISTS `caomei_auth_oauth_resource`;

CREATE TABLE `caomei_auth_oauth_resource` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `identifier` VARCHAR(768) NOT NULL,
    `name` TEXT NOT NULL,
    `access_token_ttl` INTEGER NULL,
    `refresh_token_ttl` INTEGER NULL,
    `signing_algorithm` VARCHAR(32) NULL,
    `signing_key_id` VARCHAR(191) NULL,
    `allowed_scopes` TEXT NULL,
    `custom_claims` TEXT NULL,
    `dpop_bound_access_tokens_required` BOOLEAN NOT NULL DEFAULT 0,
    `disabled` BOOLEAN NOT NULL DEFAULT 0,
    `policy_version` INTEGER NOT NULL DEFAULT 1,
    `metadata` TEXT NULL,
    UNIQUE KEY `undefined` (`identifier`),
    UNIQUE KEY `UQ_63b7a3234cb7e761bb8ec431178` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_oauth_client_resource
DROP TABLE IF EXISTS `caomei_auth_oauth_client_resource`;

CREATE TABLE `caomei_auth_oauth_client_resource` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `client_id` VARCHAR(191) NOT NULL,
    `resource_id` VARCHAR(512) NOT NULL,
    `metadata` TEXT NULL,
    KEY `IDX_66d910ee583421b58c74f76d34` (`client_id`),
    KEY `IDX_8a12fed2128cad8405547cd132` (`resource_id`),
    UNIQUE KEY `IDX_16f4c39e99d3b2619a4e92992c` (`client_id`, `resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_oauth_access_token
DROP TABLE IF EXISTS `caomei_auth_oauth_access_token`;

CREATE TABLE `caomei_auth_oauth_access_token` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `token` VARCHAR(255) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(36) NULL,
    `user_id` VARCHAR(36) NULL,
    `reference_id` VARCHAR(191) NULL,
    `authorization_code_id` VARCHAR(191) NULL,
    `resources` TEXT NULL,
    `requested_user_info_claims` TEXT NULL,
    `refresh_id` VARCHAR(36) NULL,
    `expires_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `revoked` DATETIME NULL,
    `confirmation` TEXT NULL,
    `scopes` TEXT NOT NULL,
    UNIQUE KEY `IDX_078f4bd43a276ea00117f6b5a7` (`token`),
    KEY `IDX_79dc2fd873300c86e710e1e573` (`client_id`),
    KEY `IDX_a204f51ebef92e5a0ac9abf81e` (`session_id`),
    KEY `IDX_993218a00f98d6c01350c75c48` (`user_id`),
    KEY `IDX_4884a51f27eebd700342707639` (`authorization_code_id`),
    KEY `IDX_0d00b3721ac96b0128088e83c6` (`refresh_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_oauth_refresh_token
DROP TABLE IF EXISTS `caomei_auth_oauth_refresh_token`;

CREATE TABLE `caomei_auth_oauth_refresh_token` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `token` VARCHAR(255) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(36) NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `reference_id` VARCHAR(191) NULL,
    `authorization_code_id` VARCHAR(191) NULL,
    `resources` TEXT NULL,
    `requested_user_info_claims` TEXT NULL,
    `expires_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `revoked` DATETIME NULL,
    `rotated_at` DATETIME NULL,
    `rotation_replay_response` TEXT NULL,
    `rotation_replay_expires_at` DATETIME NULL,
    `auth_time` DATETIME NULL,
    `confirmation` TEXT NULL,
    `scopes` TEXT NOT NULL,
    UNIQUE KEY `IDX_62a4b4c6becebfb576f08caf83` (`token`),
    KEY `IDX_1cf2681c8e104f4f008960e35a` (`client_id`),
    KEY `IDX_96a6a07954a0d94d48fe001173` (`session_id`),
    KEY `IDX_089bf8ffb36da54de18509e0b6` (`user_id`),
    KEY `IDX_e86ccb13bb91e92d29e0999a6a` (`authorization_code_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_oauth_consent
DROP TABLE IF EXISTS `caomei_auth_oauth_consent`;

CREATE TABLE `caomei_auth_oauth_consent` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `client_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `reference_id` VARCHAR(191) NULL,
    `resources` TEXT NULL,
    `requested_user_info_claims` TEXT NULL,
    `scopes` TEXT NOT NULL,
    KEY `IDX_8a0738a41dabfbf705c162bde1` (`client_id`),
    KEY `IDX_5537b38a6c06bb652a341fa637` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_oauth_client_assertion
DROP TABLE IF EXISTS `caomei_auth_oauth_client_assertion`;

CREATE TABLE `caomei_auth_oauth_client_assertion` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_session
DROP TABLE IF EXISTS `caomei_auth_session`;

CREATE TABLE `caomei_auth_session` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL,
    `token` TEXT NOT NULL,
    `ip_address` TEXT NULL,
    `user_agent` TEXT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `impersonated_by` VARCHAR(36) NULL,
    PRIMARY KEY (`id`),
    KEY `IDX_74025fdcaa5eb6e1da65ecd0bc` (`user_id`),
    KEY `IDX_d18c48fcaf48365c685ebba665` (`token`(255)),
    CONSTRAINT `FK_74025fdcaa5eb6e1da65ecd0bcb` FOREIGN KEY (`user_id`) REFERENCES `caomei_auth_user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_e01a03fbaf990eb8d81192ca5b2` FOREIGN KEY (`impersonated_by`) REFERENCES `caomei_auth_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_two_factor
DROP TABLE IF EXISTS `caomei_auth_two_factor`;

CREATE TABLE `caomei_auth_two_factor` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `user_id` VARCHAR(36) NOT NULL,
    `secret` TEXT NOT NULL,
    `backup_codes` TEXT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UQ_4916ed9f34f6e9e0a0cfb89a752` (`user_id`),
    KEY `IDX_ed7df12901fcf60dc40654dc47` (`user_id`),
    CONSTRAINT `FK_ed7df12901fcf60dc40654dc47a` FOREIGN KEY (`user_id`) REFERENCES `caomei_auth_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_verification
DROP TABLE IF EXISTS `caomei_auth_verification`;

CREATE TABLE `caomei_auth_verification` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `identifier` TEXT NOT NULL,
    `value` TEXT NOT NULL,
    `expires_at` TIMESTAMP NOT NULL,
    PRIMARY KEY (`id`),
    KEY `IDX_21fa41ec0f7ea099140837714d` (`identifier`(255)),
    KEY `IDX_fa68522a992ad7d16ac6f652d2` (`identifier`(255), `value`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_sso_provider
DROP TABLE IF EXISTS `caomei_auth_sso_provider`;

CREATE TABLE `caomei_auth_sso_provider` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `issuer` TEXT NOT NULL,
    `domain` VARCHAR(255) NOT NULL,
    `oidc_config` TEXT NULL,
    `saml_config` TEXT NULL,
    `provider_id` VARCHAR(128) NOT NULL,
    `organization_id` VARCHAR(36) NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `type` VARCHAR(32) NOT NULL DEFAULT 'oidc',
    `metadata_url` TEXT NULL,
    `client_id` VARCHAR(255) NULL,
    `client_secret` TEXT NULL,
    `redirect_uri` TEXT NULL,
    `scopes` VARCHAR(500) NULL,
    `additional_config` TEXT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UQ_sso_provider_provider_id` (`provider_id`),
    KEY `IDX_sso_provider_issuer` (`issuer`(255)),
    KEY `IDX_sso_provider_domain` (`domain`),
    KEY `IDX_sso_provider_provider_id` (`provider_id`),
    KEY `IDX_sso_provider_organization_id` (`organization_id`),
    KEY `IDX_sso_provider_user_id` (`user_id`),
    CONSTRAINT `FK_sso_provider_user_id` FOREIGN KEY (`user_id`) REFERENCES `caomei_auth_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_jwks
DROP TABLE IF EXISTS `caomei_auth_jwks`;

CREATE TABLE `caomei_auth_jwks` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `public_key` TEXT NOT NULL,
    `private_key` TEXT NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
