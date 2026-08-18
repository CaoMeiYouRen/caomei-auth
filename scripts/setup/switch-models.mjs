#!/usr/bin/env node

/**
 * switch-models.mjs
 * 快速切换 opencode.json 中的模型配置
 *
 * 用法：
 *   node scripts/setup/switch-models.mjs <preset>
 *   node scripts/setup/switch-models.mjs --list
 *   node scripts/setup/switch-models.mjs --current
 *
 * 示例：
 *   node scripts/setup/switch-models.mjs xiaomi      # 切换到小米模型
 *   node scripts/setup/switch-models.mjs opencode-go  # 切换到 opencode-go 模型
 */

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')
const CONFIGS_DIR = join(ROOT, '.opencode/configs')
const SHARED_CONFIG = join(CONFIGS_DIR, 'opencode.shared.json')
const TARGET_CONFIG = join(ROOT, 'opencode.json')

function mergeConfig(baseConfig, overrideConfig) {
    if (Array.isArray(baseConfig) || Array.isArray(overrideConfig)) {
        return overrideConfig ?? baseConfig
    }

    if (baseConfig === null || overrideConfig === null) {
        return overrideConfig ?? baseConfig
    }

    if (typeof baseConfig !== 'object' || typeof overrideConfig !== 'object') {
        return overrideConfig ?? baseConfig
    }

    const result = { ...baseConfig }
    for (const [key, value] of Object.entries(overrideConfig)) {
        if (key in baseConfig) {
            result[key] = mergeConfig(baseConfig[key], value)
        } else {
            result[key] = value
        }
    }

    return result
}

function normalizeConfig(config) {
    const orderedKeys = ['$schema', 'model', 'default_agent', 'instructions', 'mcp', 'agent']
    const normalized = {}

    for (const key of orderedKeys) {
        if (key in config) {
            normalized[key] = config[key]
        }
    }

    for (const [key, value] of Object.entries(config)) {
        if (!(key in normalized)) {
            normalized[key] = value
        }
    }

    return normalized
}

async function readJson(filePath) {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content)
}

async function buildPresetConfig(presetName) {
    const sharedConfig = await readJson(SHARED_CONFIG)
    const presetPath = join(CONFIGS_DIR, `opencode.${presetName}.json`)
    const presetConfig = await readJson(presetPath)

    return normalizeConfig(mergeConfig(sharedConfig, presetConfig))
}

async function listPresets() {
    const files = await readdir(CONFIGS_DIR)
    const presets = files
        .filter((f) => f.startsWith('opencode.') && f.endsWith('.json') && f !== 'opencode.shared.json')
        .map((f) => f.replace('opencode.', '').replace('.json', ''))

    return presets
}

async function getCurrentPreset() {
    const targetJson = await readJson(TARGET_CONFIG)

    const presets = await listPresets()
    for (const preset of presets) {
        const presetJson = await buildPresetConfig(preset)

        if (presetJson.model === targetJson.model) {
            return preset
        }
    }

    return null
}

async function switchPreset(presetName) {
    const presetPath = join(CONFIGS_DIR, `opencode.${presetName}.json`)

    try {
        await readFile(presetPath, 'utf-8')
    } catch {
        console.error(`❌ 配置预设 "${presetName}" 不存在`)
        const presets = await listPresets()
        console.info(`\n可用预设：${presets.join(', ')}`)
        process.exit(1)
    }

    const content = `${JSON.stringify(await buildPresetConfig(presetName), null, 4)}\n`
    await writeFile(TARGET_CONFIG, content, 'utf-8')

    const json = JSON.parse(content)
    console.info(`✅ 已切换到 "${presetName}" 配置`)
    console.info(`   顶级模型：${json.model}`)
    console.info(`   Agent 数量：${Object.keys(json.agent).length}`)
    console.info(`\n⚠️  请重启 opencode 使配置生效`)
}

async function main() {
    const args = process.argv.slice(2)

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.info(`
用法：node scripts/setup/switch-models.mjs <preset>
      node scripts/setup/switch-models.mjs --list
      node scripts/setup/switch-models.mjs --current

示例：
  node scripts/setup/switch-models.mjs xiaomi       切换到小米模型
  node scripts/setup/switch-models.mjs opencode-go   切换到 opencode-go 模型
`)
        return
    }

    if (args[0] === '--list' || args[0] === '-l') {
        const presets = await listPresets()
        const current = await getCurrentPreset()
        console.info('可用配置预设：\n')
        for (const preset of presets) {
            const marker = preset === current ? ' ← 当前' : ''
            console.info(`  • ${preset}${marker}`)
        }
        return
    }

    if (args[0] === '--current' || args[0] === '-c') {
        const current = await getCurrentPreset()
        if (current) {
            console.info(`当前配置：${current}`)
        } else {
            console.info('当前配置：自定义（不匹配任何预设）')
        }
        return
    }

    await switchPreset(args[0])
}

main().catch((err) => {
    console.error('错误：', err.message)
    process.exit(1)
})
