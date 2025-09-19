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

-- 表: caomei_auth_oauth_application
DROP TABLE IF EXISTS `caomei_auth_oauth_application`;

CREATE TABLE `caomei_auth_oauth_application` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `client_id` TEXT NOT NULL,
    `client_secret` TEXT NOT NULL,
    `name` TEXT NOT NULL,
    `redirect_ur_ls` TEXT NOT NULL,
    `metadata` TEXT NULL,
    `type` VARCHAR(32) NOT NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `user_id` VARCHAR(36) NULL,
    `description` TEXT NULL,
    `token_endpoint_auth_method` VARCHAR(32) DEFAULT 'client_secret_basic',
    `grant_types` TEXT NULL,
    `response_types` TEXT NULL,
    `client_uri` TEXT NULL,
    `logo_uri` TEXT NULL,
    `scope` TEXT NULL,
    `contacts` TEXT NULL,
    `tos_uri` TEXT NULL,
    `policy_uri` TEXT NULL,
    `jwks_uri` TEXT NULL,
    `jwks` TEXT NULL,
    `software_id` VARCHAR(64) NULL,
    `software_version` VARCHAR(32) NULL,
    `software_statement` TEXT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `IDX_dee3adb9afb19035fe52c3fd32` (`client_id`(255)),
    KEY `IDX_e99bf1ea40294f87fef9d3e13b` (`user_id`),
    CONSTRAINT `FK_e99bf1ea40294f87fef9d3e13b6` FOREIGN KEY (`user_id`) REFERENCES `caomei_auth_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_oauth_access_token
DROP TABLE IF EXISTS `caomei_auth_oauth_access_token`;

CREATE TABLE `caomei_auth_oauth_access_token` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `access_token` TEXT NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token_expires_at` TIMESTAMP NOT NULL,
    `refresh_token_expires_at` TIMESTAMP NULL,
    `client_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `scopes` TEXT NULL,
    PRIMARY KEY (`id`),
    KEY `IDX_64151152d3b06145934b2776db` (`access_token`(255)),
    KEY `IDX_79dc2fd873300c86e710e1e573` (`client_id`),
    KEY `IDX_993218a00f98d6c01350c75c48` (`user_id`),
    KEY `IDX_de6b575c18d7b60ef79b62c9f9` (`refresh_token`(255)),
    CONSTRAINT `FK_79dc2fd873300c86e710e1e5734` FOREIGN KEY (`client_id`) REFERENCES `caomei_auth_oauth_application` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_993218a00f98d6c01350c75c48a` FOREIGN KEY (`user_id`) REFERENCES `caomei_auth_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表: caomei_auth_oauth_consent
DROP TABLE IF EXISTS `caomei_auth_oauth_consent`;

CREATE TABLE `caomei_auth_oauth_consent` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `user_id` VARCHAR(36) NOT NULL,
    `client_id` VARCHAR(36) NOT NULL,
    `scopes` TEXT NULL,
    `consent_given` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `IDX_5537b38a6c06bb652a341fa637` (`user_id`),
    KEY `IDX_8a0738a41dabfbf705c162bde1` (`client_id`),
    CONSTRAINT `FK_5537b38a6c06bb652a341fa6370` FOREIGN KEY (`user_id`) REFERENCES `caomei_auth_user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_8a0738a41dabfbf705c162bde1d` FOREIGN KEY (`client_id`) REFERENCES `caomei_auth_oauth_application` (`id`) ON DELETE CASCADE
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
