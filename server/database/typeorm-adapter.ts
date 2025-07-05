import {
    type DataSource,
    type FindOptionsWhere,
    type ObjectLiteral,
    LessThan,
    LessThanOrEqual,
    MoreThan,
    MoreThanOrEqual,
    Like,
    Not,
    In,
} from 'typeorm'
import { BetterAuthError, generateId } from 'better-auth'
import { getAuthTables, type FieldAttribute } from 'better-auth/db'
import type { Adapter, BetterAuthOptions, Where } from 'better-auth/types'

function withApplyDefault(
    value: unknown,
    field: FieldAttribute,
    action: 'create' | 'update',
): unknown {
    if (action === 'update') {
        return value
    }
    if (value === undefined || value === null) {
        if (field.defaultValue) {
            if (typeof field.defaultValue === 'function') {
                return field.defaultValue()
            }
            return field.defaultValue
        }
    }
    return value
}

export const typeormAdapter =
    (dataSource: DataSource) => (options: BetterAuthOptions): Adapter => {
        const schema = getAuthTables(options)

        const createTransform = () => {
            function getField(model: string, field: string): string {
                if (field === 'id') {
                    return field
                }
                const modelSchema = schema[model]
                if (!modelSchema) {
                    throw new Error(`Model ${model} not found in schema`)
                }
                const f = modelSchema.fields[field]
                return f.fieldName || field
            }

            function convertOperatorToTypeORM(operator: string, value: unknown) {
                switch (operator) {
                    case 'eq':
                        return value
                    case 'ne':
                        return Not(value)
                    case 'gt':
                        return MoreThan(value)
                    case 'lt':
                        return LessThan(value)
                    case 'gte':
                        return MoreThanOrEqual(value)
                    case 'lte':
                        return LessThanOrEqual(value)
                    case 'in':
                        return In(value as unknown[])
                    case 'contains':
                        return Like(`%${value}%`)
                    case 'starts_with':
                        return Like(`${value}%`)
                    case 'ends_with':
                        return Like(`%${value}`)
                    default:
                        return value
                }
            }

            function convertWhereToFindOptions(
                model: string,
                where?: Where[],
            ): FindOptionsWhere<ObjectLiteral> {
                if (!where || where.length === 0) {
                    return {}
                }

                const findOptions: FindOptionsWhere<ObjectLiteral> = {}

                for (const w of where) {
                    const field = getField(model, w.field)

                    if (!w.operator || w.operator === 'eq') {
                        findOptions[field] = w.value
                    } else {
                        findOptions[field] = convertOperatorToTypeORM(w.operator, w.value)
                    }
                }

                return findOptions
            }

            function getModelName(model: string): string {
                const modelSchema = schema[model]
                if (!modelSchema) {
                    throw new Error(`Model ${model} not found in schema`)
                }
                const modelName = modelSchema.modelName
                // 直接查找匹配的 entity name，找不到则返回 modelName
                const entity = dataSource.entityMetadatas.find(
                    (e) => e.name.toLowerCase() === modelName.toLowerCase(),
                )
                return entity?.name || modelName
            }

            const useDatabaseGeneratedId = options?.advanced?.database?.generateId === false
            return {
                transformInput(
                    data: Record<string, unknown>,
                    model: string,
                    action: 'create' | 'update',
                ): Record<string, unknown> {
                    const transformedData: Record<string, unknown> =
                        useDatabaseGeneratedId || action === 'update'
                            ? {}
                            : {
                                id: options.advanced?.database?.generateId
                                    ? options.advanced.database.generateId({ model })
                                    : data.id || generateId(),
                            }
                    const modelSchema = schema[model]
                    if (!modelSchema) {
                        throw new Error(`Model ${model} not found in schema`)
                    }

                    const fields = modelSchema.fields
                    for (const field in fields) {
                        const value = data[field]
                        if (value === undefined && (!fields[field].defaultValue || action === 'update')) {
                            continue
                        }
                        transformedData[fields[field].fieldName || field] = withApplyDefault(
                            value,
                            fields[field],
                            action,
                        )
                    }
                    return transformedData
                },

                transformOutput(
                    data: ObjectLiteral | null,
                    model: string,
                    select: string[] = [],
                ): Record<string, unknown> | null {
                    if (!data) {
                        return null
                    }

                    let transformedData: Record<string, unknown> = {}
                    if (data.id || data._id) {
                        if (select.length === 0 || select.includes('id')) {
                            transformedData = { id: data.id || data._id }
                        } else {
                            transformedData = {}
                        }
                    } else {
                        transformedData = {}
                    }

                    const modelSchema = schema[model]
                    if (!modelSchema) {
                        throw new Error(`Model ${model} not found in schema`)
                    }

                    const tableSchema = modelSchema.fields
                    for (const key in tableSchema) {
                        if (select.length && !select.includes(key)) {
                            continue
                        }
                        const field = tableSchema[key]
                        if (field) {
                            transformedData[key] = data[field.fieldName || key]
                        }
                    }
                    return transformedData
                },

                convertWhereToFindOptions,
                getModelName,
                getField,
            }
        }

        const { transformInput, transformOutput, convertWhereToFindOptions, getModelName } =
            createTransform()

        return {
            id: 'typeorm',
            async create<T extends Record<string, unknown>, R = T>(data: {
                model: string
                data: T
                select?: string[]
            }): Promise<R> {

                const { model, data: values, select } = data
                const transformed = transformInput(values, model, 'create')

                const repositoryName = getModelName(model)
                const repository = dataSource.getRepository(repositoryName)

                try {
                    const result = await repository.save(transformed)
                    return transformOutput(result, model, select) as R
                } catch (error: unknown) {
                    throw new BetterAuthError(
                        `Failed to create ${model}: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            },

            async update<T>(data: {
                model: string
                where: Where[]
                update: Record<string, unknown>
                select?: string[]
            }): Promise<T | null> {
                const { model, where, update, select = [] } = data
                const repositoryName = getModelName(model)
                const repository = dataSource.getRepository(repositoryName)

                try {
                    const findOptions = convertWhereToFindOptions(model, where)
                    const transformed = transformInput(update, model, 'update')

                    if (where.length === 1) {
                        const updatedRecord = await repository.findOne({
                            where: findOptions,
                        })

                        if (updatedRecord) {
                            await repository.update(findOptions, transformed)
                            const result = await repository.findOne({
                                where: findOptions,
                            })
                            return transformOutput(result, model, select) as T
                        }
                    }

                    await repository.update(findOptions, transformed)
                    return null
                } catch (error: unknown) {
                    throw new BetterAuthError(
                        `Failed to update ${model}: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            },

            async delete(data: { model: string, where: Where[] }): Promise<void> {
                const { model, where } = data
                const repositoryName = getModelName(model)
                const repository = dataSource.getRepository(repositoryName)

                try {
                    const findOptions = convertWhereToFindOptions(model, where)
                    await repository.delete(findOptions)
                } catch (error: unknown) {
                    throw new BetterAuthError(
                        `Failed to delete ${model}: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            },

            async findOne<T>(data: {
                model: string
                where: Where[]
                select?: string[]
            }): Promise<T | null> {
                const { model, where, select } = data
                const repositoryName = getModelName(model)
                const repository = dataSource.getRepository(repositoryName)

                try {
                    const findOptions = convertWhereToFindOptions(model, where)
                    const result = await repository.findOne({
                        where: findOptions,
                        select,
                    })
                    return transformOutput(result, model, select) as T
                } catch (error: unknown) {
                    throw new BetterAuthError(
                        `Failed to find ${model}: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            },

            async findMany<T>(data: {
                model: string
                where?: Where[]
                limit?: number
                offset?: number
                sortBy?: { field: string, direction: 'asc' | 'desc' }
            }): Promise<T[]> {
                const { model, where, limit, offset, sortBy } = data
                const repositoryName = getModelName(model)
                const repository = dataSource.getRepository(repositoryName)

                try {
                    const findOptions = convertWhereToFindOptions(model, where)

                    const result = await repository.find({
                        where: findOptions,
                        take: limit || 100,
                        skip: offset || 0,
                        order: sortBy?.field
                            ? {
                                [sortBy.field]: sortBy.direction === 'desc' ? 'DESC' : 'ASC',
                            }
                            : undefined,
                    })

                    return result.map((r) => transformOutput(r, model)) as T[]
                } catch (error: unknown) {
                    throw new BetterAuthError(
                        `Failed to find many ${model}: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            },

            async count(data) {
                const { model, where } = data
                const repositoryName = getModelName(model)
                const repository = dataSource.getRepository(repositoryName)

                try {
                    const findOptions = convertWhereToFindOptions(model, where)
                    const result = await repository.count({ where: findOptions })
                    return result
                } catch (error: unknown) {
                    throw new BetterAuthError(
                        `Failed to count ${model}: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            },

            async updateMany(data) {
                const { model, where, update } = data
                const repositoryName = getModelName(model)
                const repository = dataSource.getRepository(repositoryName)

                try {
                    const findOptions = convertWhereToFindOptions(model, where)
                    const transformed = transformInput(update, model, 'update')

                    const result = await repository.update(findOptions, transformed)
                    return result.affected || 0
                } catch (error: unknown) {
                    throw new BetterAuthError(
                        `Failed to update many ${model}: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            },

            async deleteMany(data) {
                const { model, where } = data
                const repositoryName = getModelName(model)
                const repository = dataSource.getRepository(repositoryName)

                try {
                    const findOptions = convertWhereToFindOptions(model, where)
                    const result = await repository.delete(findOptions)
                    return result.affected || 0
                } catch (error: unknown) {
                    throw new BetterAuthError(
                        `Failed to delete many ${model}: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            },
        }
    }
