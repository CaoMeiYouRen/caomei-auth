import { describe, it, expect } from 'vitest'
import { SnakeCaseNamingStrategy } from '@/server/database/naming-strategy'

const strategy = new SnakeCaseNamingStrategy()

describe('SnakeCaseNamingStrategy', () => {
    describe('tableName', () => {
        it('should snake_case class name when custom name is not provided', () => {
            expect(strategy.tableName('UserProfile', undefined as any)).toBe('user_profile')
            expect(strategy.tableName('UserProfile', '')).toBe('user_profile')
        })

        it('should snake_case custom name when provided', () => {
            expect(strategy.tableName('Ignored', 'CustomName')).toBe('custom_name')
            expect(strategy.tableName('Ignored', 'my_custom_table')).toBe('my_custom_table')
        })
    })

    describe('columnName', () => {
        it('should snake_case property name when no prefixes and no custom name', () => {
            expect(strategy.columnName('createdAt', '', [])).toBe('created_at')
            expect(strategy.columnName('firstName', undefined as any, [])).toBe('first_name')
        })

        it('should snake_case custom name when provided', () => {
            expect(strategy.columnName('ignored', 'custom_column', [])).toBe('custom_column')
            expect(strategy.columnName('ignored', 'CustomColumn', [])).toBe('custom_column')
        })

        it('should include prefixes', () => {
            // Note: Current implementation concatenates prefix and name directly
            expect(strategy.columnName('createdAt', '', ['User'])).toBe('usercreated_at')
            expect(strategy.columnName('value', 'CustomValue', ['UserSettings'])).toBe('user_settingscustom_value')
            expect(strategy.columnName('street', '', ['User', 'Address'])).toBe('user_addressstreet')
        })
    })

    describe('relationName', () => {
        it('should snake_case relation name', () => {
            expect(strategy.relationName('userRoles')).toBe('user_roles')
            expect(strategy.relationName('parentCategory')).toBe('parent_category')
        })
    })

    describe('joinColumnName', () => {
        it('should combine relation name and referenced column name', () => {
            expect(strategy.joinColumnName('userRoles', 'id')).toBe('user_roles_id')
            expect(strategy.joinColumnName('owner', 'userId')).toBe('owner_user_id')
        })
    })

    describe('joinTableName', () => {
        it('should generate snake_case join table name', () => {
            expect(strategy.joinTableName('users', 'roles', 'user.roles', 'role.users'))
                .toBe('users_user_roles_roles_role_users')
        })

        it('should handle property names without dots', () => {
            expect(strategy.joinTableName('users', 'roles', 'roles', 'users'))
                .toBe('users_roles_roles_users')
        })
    })

    describe('joinTableColumnName', () => {
        it('should combine table name and column name', () => {
            expect(strategy.joinTableColumnName('user_roles', 'role', 'roleId')).toBe('user_roles_role_id')
        })

        it('should use property name if column name is missing', () => {
            expect(strategy.joinTableColumnName('user_roles', 'role')).toBe('user_roles_role')
        })
    })

    describe('classTableInheritanceParentColumnName', () => {
        it('should combine parent table name and id property', () => {
            expect(strategy.classTableInheritanceParentColumnName('UserEntity', 'id')).toBe('user_entity_id')
        })
    })

    describe('eagerJoinRelationAlias', () => {
        it('should snake_case alias and property path', () => {
            expect(strategy.eagerJoinRelationAlias('userEntity', 'roles.permissions')).toBe('user_entity_roles_permissions')
        })
    })
})
