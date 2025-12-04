import {
    type DataSource,
    type FindOptionsWhere,
    type ObjectLiteral,
    type EntityManager,
    type FindOptionsRelations,
    LessThan,
    LessThanOrEqual,
    MoreThan,
    MoreThanOrEqual,
    Like,
    Not,
    In,
} from 'typeorm'
import { BetterAuthError, DBFieldAttributeConfig, DBFieldType, generateId } from 'better-auth'
import { getAuthTables } from 'better-auth/db'
import type { DBAdapter, BetterAuthOptions, Where, DBTransactionAdapter } from 'better-auth/types'

type JoinOption = {
    [model: string]: boolean | {
        limit?: number
    }
}

type FieldAttribute = {
    type: DBFieldType
} & DBFieldAttributeConfig

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
    (dataSource: DataSource) => (options: BetterAuthOptions): DBAdapter => {
        const schema = getAuthTables(options)
        // console.log('dataSource.options.entityPrefix', dataSource.options.entityPrefix)
        // console.log('dataSource.options.namingStrategy', dataSource.options.namingStrategy)
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
                let entity = dataSource.entityMetadatas.find(
                    (e) => e.name.toLowerCase() === modelName.toLowerCase() || e.tableName.toLowerCase() === modelName.toLowerCase(),
                )
                if (!entity && dataSource.options.entityPrefix) {
                    const namingStrategy = dataSource.namingStrategy
                    const tableName = namingStrategy.tableName(modelName, modelName)
                    const prefixedName = (dataSource.options.entityPrefix + tableName).toLowerCase()
                    entity = dataSource.entityMetadatas.find(
                        (e) => e.tableName.toLowerCase() === prefixedName,
                    )
                }
                return entity?.name || modelName
            }

            function getRelationName(model: string, joinedModel: string): string | undefined {
                const repositoryName = getModelName(model)
                const metadata = dataSource.getRepository(repositoryName).metadata
                const joinedModelName = getModelName(joinedModel)

                const relation = metadata.relations.find((r) => {
                    // 1. 优先使用 inverseEntityMetadata 匹配
                    if (r.inverseEntityMetadata) {
                        if (r.inverseEntityMetadata.name.toLowerCase() === joinedModelName.toLowerCase()) {
                            return true
                        }
                        if (r.inverseEntityMetadata.tableName.toLowerCase() === joinedModelName.toLowerCase()) {
                            return true
                        }
                    }

                    let targetName = ''
                    if (typeof r.target === 'string') {
                        targetName = r.target
                    } else if (typeof r.target === 'function') {
                        targetName = (r.target as any).name
                    }

                    // 2. 直接匹配名称 (忽略大小写)
                    if (targetName.toLowerCase() === joinedModelName.toLowerCase()) {
                        return true
                    }

                    // 3. 通过 EntityMetadata 匹配
                    const targetEntity = dataSource.entityMetadatas.find((e) => e.name === targetName || e.target === r.target)
                    if (targetEntity) {
                        if (targetEntity.name.toLowerCase() === joinedModelName.toLowerCase()) {
                            return true
                        }
                        if (targetEntity.tableName.toLowerCase() === joinedModelName.toLowerCase()) {
                            return true
                        }
                    }
                    return false
                })

                if (relation) {
                    return relation.propertyName
                }

                // 尝试直接使用 joinedModel 作为属性名
                const relationByProp = metadata.relations.find((r) => r.propertyName === joinedModel)
                if (relationByProp) {
                    return relationByProp.propertyName
                }
                return undefined
            }

            function convertJoinToRelations(
                model: string,
                join?: JoinOption,
            ): FindOptionsRelations<ObjectLiteral> | undefined {
                if (!join) {
                    return undefined
                }
                const relations: FindOptionsRelations<ObjectLiteral> = {}

                for (const [joinedModel, joinConfig] of Object.entries(join)) {
                    if (joinConfig === false) {
                        continue
                    }
                    const relationName = getRelationName(model, joinedModel)
                    if (relationName) {
                        relations[relationName] = true
                    }
                }
                return relations
            }

            const useDatabaseGeneratedId = options?.advanced?.database?.generateId === false
            return {
                transformInput(
                    data: Record<string, unknown>,
                    model: string,
                    action: 'create' | 'update',
                    forceAllowId?: boolean,
                ): Record<string, unknown> {
                    let transformedData: Record<string, unknown>
                    if (action === 'update') {
                        transformedData = {}
                    } else if (forceAllowId && data.id) {
                        transformedData = { id: data.id }
                    } else if (useDatabaseGeneratedId) {
                        transformedData = {}
                    } else {
                        transformedData = {
                            id: typeof options.advanced?.database?.generateId === 'function'
                                ? options.advanced.database.generateId({ model })
                                : data.id || generateId(),
                        }
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

                    // console.log('transformOutput model:', model)
                    // console.log('transformOutput data keys:', Object.keys(data))

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
                    // console.log('transformOutput tableSchema keys:', Object.keys(tableSchema))

                    for (const key in tableSchema) {
                        if (select.length && !select.includes(key)) {
                            continue
                        }
                        const field = tableSchema[key]
                        if (field) {
                            transformedData[key] = data[field.fieldName || key]
                        }
                    }
                    // console.log('transformOutput result keys:', Object.keys(transformedData))

                    // Fix: Remove nested user field if present in user model
                    // if (model === 'user' && 'user' in transformedData) {
                    //     delete transformedData.user
                    // }

                    return transformedData
                },

                convertWhereToFindOptions,
                getModelName,
                getField,
                convertJoinToRelations,
                getRelationName,
            }
        }

        const { transformInput, transformOutput, convertWhereToFindOptions, getModelName, convertJoinToRelations, getRelationName } =
            createTransform()

        const createAdapter = (manager: EntityManager): DBTransactionAdapter => ({
            id: 'typeorm',
            async create<T extends Record<string, unknown>, R = T>(data: {
                model: string
                data: T
                select?: string[]
                forceAllowId?: boolean
            }): Promise<R> {
                const { model, data: values, select, forceAllowId } = data
                const transformed = transformInput(values, model, 'create', forceAllowId)

                const repositoryName = getModelName(model)
                const repository = manager.getRepository(repositoryName)

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
                const repository = manager.getRepository(repositoryName)

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
                const repository = manager.getRepository(repositoryName)

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
                join?: JoinOption
            }): Promise<T | null> {
                const { model, where, select, join } = data
                const repositoryName = getModelName(model)
                const repository = manager.getRepository(repositoryName)

                try {
                    const findOptions = convertWhereToFindOptions(model, where)
                    const relations = convertJoinToRelations(model, join)
                    const result = await repository.findOne({
                        where: findOptions,
                        select,
                        relations,
                    })
                    const transformed = transformOutput(result, model, select) as any
                    if (transformed && join) {
                        for (const [joinedModel, joinConfig] of Object.entries(join)) {
                            if (joinConfig === false) {
                                continue
                            }
                            const relationName = getRelationName(model, joinedModel)
                            if (relationName && result && relationName in result) {
                                const relationData = result[relationName]
                                if (Array.isArray(relationData)) {
                                    transformed[relationName] = relationData.map((item) => transformOutput(item, joinedModel))
                                } else if (relationData) {
                                    transformed[relationName] = transformOutput(relationData, joinedModel)
                                }
                            }
                        }
                    }
                    return transformed as T
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
                join?: JoinOption
            }): Promise<T[]> {
                const { model, where, limit, offset, sortBy, join } = data
                const repositoryName = getModelName(model)
                const repository = manager.getRepository(repositoryName)

                try {
                    const findOptions = convertWhereToFindOptions(model, where)
                    const relations = convertJoinToRelations(model, join)

                    const result = await repository.find({
                        where: findOptions,
                        take: limit || 100,
                        skip: offset || 0,
                        order: sortBy?.field
                            ? {
                                [sortBy.field]: sortBy.direction === 'desc' ? 'DESC' : 'ASC',
                            }
                            : undefined,
                        relations,
                    })

                    return result.map((r) => {
                        const transformed = transformOutput(r, model) as any
                        if (transformed && join) {
                            for (const [joinedModel, joinConfig] of Object.entries(join)) {
                                if (joinConfig === false) {
                                    continue
                                }
                                const relationName = getRelationName(model, joinedModel)
                                if (relationName && r && relationName in r) {
                                    const relationData = r[relationName]
                                    if (Array.isArray(relationData)) {
                                        transformed[relationName] = relationData.map((item) => transformOutput(item, joinedModel))
                                    } else if (relationData) {
                                        transformed[relationName] = transformOutput(relationData, joinedModel)
                                    }
                                }
                            }
                        }
                        return transformed
                    }) as T[]
                } catch (error: unknown) {
                    throw new BetterAuthError(
                        `Failed to find many ${model}: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            },

            async count(data) {
                const { model, where } = data
                const repositoryName = getModelName(model)
                const repository = manager.getRepository(repositoryName)

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
                const repository = manager.getRepository(repositoryName)

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
                const repository = manager.getRepository(repositoryName)

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
        })

        return {
            ...createAdapter(dataSource.manager),
            async transaction<R>(
                callback: (trx: DBTransactionAdapter) => Promise<R>,
            ): Promise<R> {
                return dataSource.transaction(async (manager) => {
                    const adapter = createAdapter(manager)
                    return callback(adapter)
                })
            },
        }
    }

