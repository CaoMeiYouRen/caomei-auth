import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm'
import { snakeCase } from 'lodash-es'

export class SnakeCaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string, customName: string): string {
        return customName ? snakeCase(customName) : snakeCase(className)
    }

    columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
        return snakeCase(embeddedPrefixes.join('_')) + (customName ? snakeCase(customName) : snakeCase(propertyName))
    }

    relationName(propertyName: string): string {
        return snakeCase(propertyName)
    }

    joinColumnName(relationName: string, referencedColumnName: string): string {
        return snakeCase(`${relationName}_${referencedColumnName}`)
    }

    joinTableName(firstTableName: string, secondTableName: string, firstPropertyName: string, secondPropertyName: string): string {
        return snakeCase(`${firstTableName}_${firstPropertyName.replace(/\./gi, '_')}_${secondTableName}_${secondPropertyName.replace(/\./gi, '_')}`)
    }

    joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
        return snakeCase(`${tableName}_${columnName ? columnName : propertyName}`)
    }

    classTableInheritanceParentColumnName(parentTableName: any, parentTableIdPropertyName: any): string {
        return snakeCase(`${parentTableName}_${parentTableIdPropertyName}`)
    }

    eagerJoinRelationAlias(alias: string, propertyPath: string): string {
        return snakeCase(`${alias}_${propertyPath.replace('.', '_')}`)
    }
}
