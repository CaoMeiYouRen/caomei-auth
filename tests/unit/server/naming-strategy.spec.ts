import { describe, it, expect } from 'vitest'
import { SnakeCaseNamingStrategy } from '@/server/database/naming-strategy'

const strategy = new SnakeCaseNamingStrategy()

describe('SnakeCaseNamingStrategy', () => {
    it('tableName should snake_case class or custom name', () => {
        expect(strategy.tableName('UserProfile', '')).toBe('user_profile')
        expect(strategy.tableName('Ignored', 'CustomName')).toBe('custom_name')
    })

    it('columnName should snake_case column and prefixes', () => {
        expect(strategy.columnName('createdAt', '', ['User'])).toBe('usercreated_at')
        expect(strategy.columnName('value', 'CustomValue', ['UserSettings'])).toBe('user_settingscustom_value')
    })

    it('relationName should snake_case relation names', () => {
        expect(strategy.relationName('userRoles')).toBe('user_roles')
    })

    it('joinColumnName should include relation and referenced column names', () => {
        expect(strategy.joinColumnName('userRoles', 'id')).toBe('user_roles_id')
    })

    it('joinTableName should snake_case composed identifiers', () => {
        expect(strategy.joinTableName('users', 'roles', 'user.roles', 'role.users')).toBe('users_user_roles_roles_role_users')
    })

    it('joinTableColumnName should combine table and column names', () => {
        expect(strategy.joinTableColumnName('user_roles', 'role', 'roleId')).toBe('user_roles_role_id')
        expect(strategy.joinTableColumnName('user_roles', 'role')).toBe('user_roles_role')
    })

    it('classTableInheritanceParentColumnName should join parent info', () => {
        expect(strategy.classTableInheritanceParentColumnName('UserEntity', 'id')).toBe('user_entity_id')
    })

    it('eagerJoinRelationAlias should snake_case alias paths', () => {
        expect(strategy.eagerJoinRelationAlias('userEntity', 'roles.permissions')).toBe('user_entity_roles_permissions')
    })
})
