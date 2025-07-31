# 短信登录配置

短信登录提供基于手机号的认证方式，支持手机号+密码登录和短信验证码登录。

> **📌 当前实现状态**: 
> - ✅ **已实现**: Spug 短信平台（仅支持中国大陆手机号）
> - 🚧 **计划中**: 阿里云短信、腾讯云短信（支持国际号码）
> - 💡 **扩展**: 可自行参考代码实现其他短信平台

## 功能特性

- **手机号密码登录**: 传统的手机号+密码登录方式
- **短信验证码登录**: 无需密码，通过短信验证码登录
- **手机号验证**: 新用户注册时手机号验证
- **密码重置**: 通过短信重置密码

## 环境变量配置

### 基础短信配置

```env
# 启用短信功能
NUXT_PUBLIC_PHONE_ENABLED=true

# 短信服务配置
PHONE_SENDER_NAME="草梅Auth"          # 短信发送者名称
PHONE_EXPIRES_IN=300                 # 验证码有效时间（秒）
PHONE_CHANNEL=spug                   # 短信渠道
```

### 限流配置

```env
# 短信发送限制
PHONE_DAILY_LIMIT=100                    # 全局每日短信发送上限
PHONE_SINGLE_USER_DAILY_LIMIT=3         # 单个手机号每日验证码发送上限
```

## 支持的短信服务商

> **📋 当前状态**: 目前仅接入了 Spug 短信平台，其他平台正在计划开发中。

### Spug 短信服务（已实现）

Spug 是目前唯一支持的短信服务提供商，提供稳定可靠的短信发送服务。

> **⚠️ 重要说明**: Spug 平台目前仅支持中国大陆手机号（+86），不支持国际手机号。如需支持国际用户，请等待其他服务商的接入或自行扩展实现。

#### 配置步骤

1. 注册 [Spug 账户](https://push.spug.cc)
2. 创建短信应用
3. 配置短信模板
4. 获取模板 ID

```env
PHONE_CHANNEL=spug
PHONE_SPUG_TEMPLATE_ID=your-template-id
```

#### 支持范围

- ✅ 中国大陆手机号 (+86)
- ❌ 国际手机号

#### 短信模板格式

推荐的短信模板：

```
${key1}欢迎您，您的验证码为${key2}，${key3}分钟内有效，如非本人操作请忽略。
```

模板变量说明：
- `${key1}`: 应用名称（自动填充）
- `${key2}`: 验证码（自动生成）
- `${key3}`: 有效时间（自动计算）

### 阿里云短信服务（计划中）

> **🚧 开发状态**: 此功能正在开发中，暂未实现。

阿里云短信服务将支持国内外手机号，适合需要国际化支持的场景。

```env
# 计划支持的配置项
PHONE_CHANNEL=aliyun
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_SMS_SIGN_NAME=your-sign-name
ALIYUN_SMS_TEMPLATE_CODE=SMS_123456789
```

#### 计划支持范围
- ✅ 中国大陆手机号 (+86)
- ✅ 国际手机号（需要开通国际短信服务）

### 腾讯云短信服务（计划中）

> **🚧 开发状态**: 此功能正在开发中，暂未实现。

腾讯云短信服务将支持国内外手机号发送。

```env
# 计划支持的配置项
PHONE_CHANNEL=tencent
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
TENCENT_SMS_APP_ID=your-app-id
TENCENT_SMS_SIGN=your-sign
TENCENT_SMS_TEMPLATE_ID=123456
```

#### 计划支持范围
- ✅ 中国大陆手机号 (+86)
- ✅ 国际手机号（需要开通国际短信服务）

## 服务商选择建议

根据您的业务需求选择合适的短信服务商：

| 服务商 | 实现状态 | 中国大陆 | 国际支持 | 价格 | 推荐场景 |
|--------|----------|----------|----------|------|----------|
| Spug | ✅ 已实现 | ✅ | ❌ | 较低 | 仅服务中国大陆用户 |
| 阿里云 | 🚧 计划中 | ✅ | ✅ | 中等 | 需要国际化支持 |
| 腾讯云 | 🚧 计划中 | ✅ | ✅ | 中等 | 需要国际化支持 |

> **💡 扩展提示**: 如您需要使用其他短信服务商，可以参考 `server/utils/phone.ts` 中的 Spug 实现，添加新的 case 分支来扩展支持。

## 手机号格式支持

### 中国大陆

支持标准的中国大陆手机号格式：

```javascript
// 支持的格式
const validFormats = [
  '13812348888',      // 11位数字
  '+8613812348888',   // 国际格式
  '86-138-1234-8888'  // 带分隔符
]
```

### 国际号码

> **注意**: 目前只支持 Spug 短信服务商，仅能发送中国大陆手机号。国际号码支持需要等待阿里云或腾讯云等国际短信服务商的接入。

```javascript
// 国际号码格式示例（暂不支持）
const internationalFormats = [
  '+1-555-123-4567',  // 美国
  '+44-20-1234-5678', // 英国
  '+81-90-1234-5678'  // 日本
]
```

## 前端集成

### 手机号密码登录

```vue
<template>
  <form @submit.prevent="loginWithPhone">
    <div class="form-group">
      <label>手机号</label>
      <phone-input 
        v-model="phone" 
        required 
        placeholder="请输入手机号"
      />
    </div>
    
    <div class="form-group">
      <label>密码</label>
      <input 
        v-model="password" 
        type="password" 
        required 
        placeholder="请输入密码"
      />
    </div>
    
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? '登录中...' : '登录' }}
    </button>
  </form>
</template>

<script setup>
import { authClient } from '@/lib/auth-client'

const phone = ref('')
const password = ref('')
const isLoading = ref(false)

const loginWithPhone = async () => {
  isLoading.value = true
  try {
    await authClient.signIn.phone({
      phone: phone.value,
      password: password.value
    })
    await navigateTo('/')
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
```

### 短信验证码登录

```vue
<template>
  <form @submit.prevent="step === 1 ? sendSmsCode() : loginWithSmsCode()">
    <div class="form-group">
      <label>手机号</label>
      <phone-input 
        v-model="phone" 
        required 
        :disabled="step === 2"
        placeholder="请输入手机号"
      />
    </div>
    
    <div v-if="step === 2" class="form-group">
      <label>验证码</label>
      <input 
        v-model="code" 
        type="text" 
        required 
        placeholder="请输入6位验证码"
        maxlength="6"
      />
    </div>
    
    <button type="submit" :disabled="isLoading">
      {{ buttonText }}
    </button>
    
    <div v-if="step === 2" class="resend-section">
      <button 
        type="button" 
        @click="sendSmsCode" 
        :disabled="countdown > 0"
      >
        {{ countdown > 0 ? `${countdown}秒后重发` : '重新发送' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { authClient } from '@/lib/auth-client'

const phone = ref('')
const code = ref('')
const step = ref(1) // 1: 发送验证码, 2: 输入验证码
const isLoading = ref(false)
const countdown = ref(0)

const buttonText = computed(() => {
  if (isLoading.value) return '处理中...'
  return step.value === 1 ? '发送验证码' : '登录'
})

const sendSmsCode = async () => {
  isLoading.value = true
  try {
    await $fetch('/api/auth/send-phone-code', {
      method: 'POST',
      body: { phone: phone.value }
    })
    step.value = 2
    startCountdown()
  } catch (error) {
    console.error('发送验证码失败:', error)
  } finally {
    isLoading.value = false
  }
}

const loginWithSmsCode = async () => {
  isLoading.value = true
  try {
    await authClient.signIn.phoneCode({
      phone: phone.value,
      code: code.value
    })
    await navigateTo('/')
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    isLoading.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}
</script>
```

### 手机号输入组件

```vue
<template>
  <div class="phone-input">
    <select v-model="countryCode" class="country-select">
      <option value="+86">🇨🇳 +86</option>
      <option value="+1">🇺🇸 +1</option>
      <option value="+44">🇬🇧 +44</option>
      <option value="+81">🇯🇵 +81</option>
    </select>
    <input 
      v-model="phoneNumber"
      type="tel" 
      :placeholder="placeholder"
      @input="onInput"
      class="phone-number-input"
    />
  </div>
</template>

<script setup>
interface Props {
  modelValue?: string
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入手机号'
})

const emit = defineEmits<Emits>()

const countryCode = ref('+86')
const phoneNumber = ref('')

const onInput = () => {
  const fullPhone = countryCode.value + phoneNumber.value
  emit('update:modelValue', fullPhone)
}

// 解析传入的完整手机号
watch(() => props.modelValue, (value) => {
  if (value) {
    const match = value.match(/^(\+\d{1,3})(.+)$/)
    if (match) {
      countryCode.value = match[1]
      phoneNumber.value = match[2]
    }
  }
})
</script>

<style scoped>
.phone-input {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.country-select {
  min-width: 80px;
  border: none;
  padding: 8px;
  background: #f5f5f5;
}

.phone-number-input {
  flex: 1;
  border: none;
  padding: 8px;
  outline: none;
}
</style>
```

## 手机号验证

### 格式验证

```javascript
// 手机号格式验证
export function validatePhone(phone: string): boolean {
  // 中国大陆手机号
  if (phone.startsWith('+86') || phone.length === 11) {
    const number = phone.replace(/^\+86/, '')
    return /^1[3-9]\d{9}$/.test(number)
  }
  
  // 国际号码（简单验证）
  return /^\+\d{7,15}$/.test(phone)
}

// 标准化手机号格式
export function normalizePhone(phone: string): string {
  // 移除所有非数字和+号
  phone = phone.replace(/[^\d+]/g, '')
  
  // 中国大陆号码添加国家代码
  if (phone.length === 11 && phone.startsWith('1')) {
    return '+86' + phone
  }
  
  return phone
}
```

## 常见问题

### 1. 短信发送失败

**可能原因**:
- 手机号格式错误
- 短信服务商配置错误
- 账户余额不足
- 短信内容被拦截
- 尝试发送国际手机号（目前仅支持中国大陆号码）

**解决方案**:
```bash
# 检查手机号格式
echo "手机号: $PHONE_NUMBER"

# 验证短信服务配置
curl -X POST https://api.spug.cc/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "13812348888", "template_id": "123456"}'

# 注意：目前仅支持中国大陆手机号，国际短信需要等待其他服务商接入
```

### 2. 验证码未收到

**可能原因**:
- 手机信号问题
- 短信被拦截
- 运营商延迟
- 手机设置问题

**解决方案**:
- 检查手机信号和设置
- 联系运营商客服
- 使用备用验证方式

### 3. 验证码过期

**解决方案**:
```env
# 调整验证码有效期
PHONE_EXPIRES_IN=600  # 延长到10分钟
```

### 4. 短信成本过高

**优化方案**:
- 使用图形验证码预过滤
- 实施更严格的发送限制
- 选择性价比更高的服务商
- 优化短信模板内容

## 测试和调试

### 开发环境测试

```bash
# 测试短信发送API
curl -X POST http://localhost:3000/api/auth/send-phone-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+8613812348888"}'

# 测试手机号登录
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+8613812348888",
    "password": "password123"
  }'
```

### 测试工具

- **模拟器测试**: 使用模拟手机号进行测试
- **真机测试**: 使用真实手机号验证完整流程
- **压力测试**: 测试并发发送能力

## 扩展开发指南

### 添加新的短信服务商

如果您需要接入其他短信服务商，可以参考以下步骤：

1. **修改环境变量配置**

在 `.env.example` 中添加新的配置项：

```env
# 新短信服务商配置
PHONE_CHANNEL=new-provider
NEW_PROVIDER_API_KEY=your-api-key
NEW_PROVIDER_SECRET=your-secret
NEW_PROVIDER_TEMPLATE_ID=your-template-id
```

2. **扩展 phone.ts 工具函数**

在 `server/utils/phone.ts` 中添加新的 case 分支：

```typescript
switch (PHONE_CHANNEL) {
    case 'spug': {
        // 现有的 Spug 实现
        // ...
    }
    case 'new-provider': {
        // 新服务商的实现
        const body = JSON.stringify({
            phone: phoneNumber,
            code: code,
            template_id: NEW_PROVIDER_TEMPLATE_ID
        })
        
        const resp = await fetch('https://api.new-provider.com/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NEW_PROVIDER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body,
        })
        
        return resp.json()
    }
    default:
        throw new Error('未匹配到短信发送渠道，请切换到其他登录方式或实现短信发送功能')
}
```

3. **更新手机号验证**

如果新服务商支持国际号码，可能需要调整 `validatePhone` 函数的逻辑。

4. **添加配置验证**

在 `utils/env.ts` 中添加新的环境变量：

```typescript
export const NEW_PROVIDER_API_KEY = getEnv('NEW_PROVIDER_API_KEY')
export const NEW_PROVIDER_SECRET = getEnv('NEW_PROVIDER_SECRET')
export const NEW_PROVIDER_TEMPLATE_ID = getEnv('NEW_PROVIDER_TEMPLATE_ID')
```

5. **更新文档**

在本文档中添加新服务商的配置说明和使用指南。

### 贡献代码

如果您成功接入了新的短信服务商，欢迎提交 Pull Request 贡献给项目：

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/add-sms-provider`)
3. 提交代码 (`git commit -am 'feat: 添加新短信服务商支持'`)
4. 推送分支 (`git push origin feature/add-sms-provider`)
5. 创建 Pull Request

## 法律合规

### 隐私保护

- 明确告知短信使用目的
- 获得用户明确同意
- 提供退订机制
- 安全存储手机号数据

### 反垃圾短信

- 实施发送频率限制
- 提供明确的退订方式
- 避免发送营销短信
- 遵守当地法律法规
