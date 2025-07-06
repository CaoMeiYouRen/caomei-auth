import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class Migration implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 创建 User 表
        await queryRunner.createTable(
            new Table({
                name: 'caomei_auth_users',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        isPrimary: true,
                    },
                    {
                        name: 'username',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'displayUsername',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        isNullable: true,
                        isUnique: true,
                    },
                    {
                        name: 'emailVerified',
                        type: 'datetime',
                        isNullable: true,
                    },
                    {
                        name: 'phoneNumber',
                        type: 'varchar',
                        isNullable: true,
                        isUnique: true,
                    },
                    {
                        name: 'phoneNumberVerified',
                        type: 'datetime',
                        isNullable: true,
                    },
                    {
                        name: 'image',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        )

        // 创建 Account 表
        await queryRunner.createTable(
            new Table({
                name: 'caomei_auth_accounts',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        isPrimary: true,
                    },
                    {
                        name: 'userId',
                        type: 'varchar',
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                    },
                    {
                        name: 'provider',
                        type: 'varchar',
                    },
                    {
                        name: 'providerAccountId',
                        type: 'varchar',
                    },
                    {
                        name: 'refresh_token',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'access_token',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'expires_at',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'token_type',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'scope',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'id_token',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'session_state',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'oauth_token_secret',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'oauth_token',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['userId'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'caomei_auth_users',
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        )

        // 创建 Session 表
        await queryRunner.createTable(
            new Table({
                name: 'caomei_auth_sessions',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        isPrimary: true,
                    },
                    {
                        name: 'sessionToken',
                        type: 'varchar',
                        isUnique: true,
                    },
                    {
                        name: 'userId',
                        type: 'varchar',
                    },
                    {
                        name: 'expires',
                        type: 'datetime',
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['userId'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'caomei_auth_users',
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        )

        // 创建 Verification 表
        await queryRunner.createTable(
            new Table({
                name: 'caomei_auth_verification',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        isPrimary: true,
                    },
                    {
                        name: 'identifier',
                        type: 'varchar',
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        isUnique: true,
                    },
                    {
                        name: 'expires',
                        type: 'datetime',
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 按相反顺序删除表，避免外键约束问题
        await queryRunner.dropTable('caomei_auth_verification', true)
        await queryRunner.dropTable('caomei_auth_sessions', true)
        await queryRunner.dropTable('caomei_auth_accounts', true)
        await queryRunner.dropTable('caomei_auth_users', true)
    }
}
