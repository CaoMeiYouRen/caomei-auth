# 短信登录配置

短信登录提供基于手机号的认证方式，支持手机号+密码登录和短信验证码登录。

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

### Spug 短信服务

Spug 是推荐的短信服务提供商，提供稳定可靠的短信发送服务。

#### 配置步骤

1. 注册 [Spug 账户](https://push.spug.cc)
2. 创建短信应用
3. 配置短信模板
4. 获取模板 ID

```env
PHONE_CHANNEL=spug
PHONE_SPUG_TEMPLATE_ID=your-template-id
```

#### 短信模板格式

推荐的短信模板：

```
${key1}欢迎您，您的验证码为${key2}，${key3}分钟内有效，如非本人操作请忽略。
```

模板变量说明：
- `${key1}`: 应用名称（自动填充）
- `${key2}`: 验证码（自动生成）
- `${key3}`: 有效时间（自动计算）

### 阿里云短信服务

```env
PHONE_CHANNEL=aliyun
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_SMS_SIGN_NAME=your-sign-name
ALIYUN_SMS_TEMPLATE_CODE=SMS_123456789
```

### 腾讯云短信服务

```env
PHONE_CHANNEL=tencent
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
TENCENT_SMS_APP_ID=your-app-id
TENCENT_SMS_SIGN=your-sign
TENCENT_SMS_TEMPLATE_ID=123456
```

## 手机号格式支持

### 中国大陆

```javascript
// 支持的格式
const validFormats = [
  '13812348888',      // 11位数字
  '+8613812348888',   // 国际格式
  '86-138-1234-8888'  // 带分隔符
]
```

### 国际号码

```javascript
// 国际号码格式
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

### 敏感词过滤

```javascript
// 短信内容安全检查
export function validateSmsContent(content: string): boolean {
  const sensitiveWords = ['赌博', '借贷', '投资', '理财']
  return !sensitiveWords.some(word => content.includes(word))
}
```

## 安全配置

### 防刷验证码

```env
# 验证码发送限制
SMS_RATE_LIMIT_WINDOW=60          # 限制时间窗口（秒）
SMS_RATE_LIMIT_MAX_ATTEMPTS=3     # 时间窗口内最大发送次数
SMS_IP_DAILY_LIMIT=10             # 单个IP每日发送限制
```

### 验证码安全

```javascript
// 验证码生成配置
const smsCodeConfig = {
  length: 6,              // 验证码长度
  type: 'numeric',        // 类型：numeric, alphabetic, alphanumeric
  expiresIn: 300,        // 有效期（秒）
  maxAttempts: 5         // 最大验证尝试次数
}
```

### 手机号绑定安全

```env
# 手机号绑定限制
PHONE_BIND_COOLDOWN=86400         # 手机号绑定冷却时间（秒）
MAX_PHONE_ACCOUNTS=3              # 单个手机号最大绑定账户数
```

## 成本优化

### 短信费用控制

```env
# 费用控制
SMS_MONTHLY_BUDGET=1000           # 月度短信预算（条数）
SMS_COST_ALERT_THRESHOLD=0.8      # 费用预警阈值
```

### 智能发送策略

```javascript
// 根据用户行为优化发送
const smartSmsStrategy = {
  newUser: {
    priority: 'high',
    template: 'welcome'
  },
  returningUser: {
    priority: 'normal',
    template: 'verification'
  },
  suspiciousActivity: {
    priority: 'low',
    requireAdditionalVerification: true
  }
}
```

## 监控和分析

### 短信发送统计

```javascript
// 发送统计指标
const smsMetrics = {
  totalSent: 0,           // 总发送量
  successRate: 0.95,      // 成功率
  averageDeliveryTime: 30, // 平均到达时间（秒）
  costPerMessage: 0.05,   // 单条成本
  conversionRate: 0.85    // 验证转化率
}
```

### 异常监控

```javascript
// 监控异常情况
const alertConditions = {
  highFailureRate: 0.1,      // 失败率超过10%
  slowDelivery: 120,         // 发送超过2分钟
  suspiciousVolume: 1000,    // 小时内发送量异常
  costOverrun: 1.2           // 成本超预算20%
}
```

## 常见问题

### 1. 短信发送失败

**可能原因**:
- 手机号格式错误
- 短信服务商配置错误
- 账户余额不足
- 短信内容被拦截

**解决方案**:
```bash
# 检查手机号格式
echo "手机号: $PHONE_NUMBER"

# 验证短信服务配置
curl -X POST https://api.spug.cc/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "13812348888", "template_id": "123456"}'
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
