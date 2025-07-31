# 邮箱登录配置

邮箱登录是最常用的认证方式，支持邮箱+密码登录和邮箱验证码登录两种模式。

## 功能特性

- **邮箱密码登录**: 传统的邮箱+密码登录方式
- **邮箱验证码登录**: 无需密码，通过邮箱验证码登录
- **邮箱验证**: 新用户注册时邮箱验证
- **密码重置**: 通过邮箱重置密码

## 环境变量配置

### 基础邮件配置

```env
# SMTP 服务器配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Your App Name <your-email@gmail.com>"

# 验证码配置
EMAIL_EXPIRES_IN=300  # 验证码有效期(秒)
```

### 限流配置

```env
# 邮件发送限制
EMAIL_DAILY_LIMIT=100                    # 全局每日邮件发送上限
EMAIL_SINGLE_USER_DAILY_LIMIT=5         # 单个邮箱每日验证码发送上限
```

## 支持的邮件服务商

### Gmail 配置

1. 启用两步验证
2. 生成应用密码
3. 使用应用密码作为 `EMAIL_PASS`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM="Your App <your-email@gmail.com>"
```

### 腾讯企业邮箱

```env
EMAIL_HOST=smtp.exmail.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourcompany.com
EMAIL_PASS=your-password
EMAIL_FROM="Your App <your-email@yourcompany.com>"
```

### 阿里云邮件推送

```env
EMAIL_HOST=smtpdm.aliyun.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@your-domain.com
EMAIL_PASS=your-smtp-password
EMAIL_FROM="Your App <your-email@your-domain.com>"
```

### Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
EMAIL_FROM="Your App <your-email@outlook.com>"
```

## 邮件模板

系统内置以下邮件模板：

### 验证码邮件

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>邮箱验证码</title>
</head>
<body>
    <h2>您的验证码</h2>
    <p>您的验证码是：<strong>{{code}}</strong></p>
    <p>验证码将在 {{expiresIn}} 分钟后过期。</p>
    <p>如果这不是您的操作，请忽略此邮件。</p>
</body>
</html>
```

### 欢迎邮件

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>欢迎加入</title>
</head>
<body>
    <h2>欢迎加入 {{appName}}</h2>
    <p>您好 {{userName}}，</p>
    <p>感谢您注册我们的服务。您可以开始使用了！</p>
    <a href="{{loginUrl}}">立即登录</a>
</body>
</html>
```

## 前端集成

### 邮箱密码登录

```vue
<template>
  <form @submit.prevent="loginWithEmail">
    <div class="form-group">
      <label>邮箱地址</label>
      <input 
        v-model="email" 
        type="email" 
        required 
        placeholder="请输入邮箱地址"
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

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const loginWithEmail = async () => {
  isLoading.value = true
  try {
    await authClient.signIn.email({
      email: email.value,
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

### 邮箱验证码登录

```vue
<template>
  <form @submit.prevent="step === 1 ? sendCode() : loginWithCode()">
    <div class="form-group">
      <label>邮箱地址</label>
      <input 
        v-model="email" 
        type="email" 
        required 
        :disabled="step === 2"
        placeholder="请输入邮箱地址"
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
        @click="sendCode" 
        :disabled="countdown > 0"
      >
        {{ countdown > 0 ? `${countdown}秒后重发` : '重新发送' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { authClient } from '@/lib/auth-client'

const email = ref('')
const code = ref('')
const step = ref(1) // 1: 发送验证码, 2: 输入验证码
const isLoading = ref(false)
const countdown = ref(0)

const buttonText = computed(() => {
  if (isLoading.value) return '处理中...'
  return step.value === 1 ? '发送验证码' : '登录'
})

const sendCode = async () => {
  isLoading.value = true
  try {
    await $fetch('/api/auth/send-email-code', {
      method: 'POST',
      body: { email: email.value }
    })
    step.value = 2
    startCountdown()
  } catch (error) {
    console.error('发送验证码失败:', error)
  } finally {
    isLoading.value = false
  }
}

const loginWithCode = async () => {
  isLoading.value = true
  try {
    await authClient.signIn.emailCode({
      email: email.value,
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

## 安全配置

### 密码强度要求

```env
# 密码策略配置
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true
```

### 防暴力破解

```env
# 登录失败锁定配置
MAX_LOGIN_ATTEMPTS=5         # 最大登录尝试次数
LOCK_DURATION=900           # 锁定时长(秒)
```

### 邮箱验证要求

```env
# 邮箱验证配置
REQUIRE_EMAIL_VERIFICATION=true    # 是否要求邮箱验证
EMAIL_VERIFICATION_EXPIRES=24      # 邮箱验证链接有效期(小时)
```

## 测试配置

### 开发环境测试

```bash
# 测试邮件发送
curl -X POST http://localhost:3000/api/auth/send-email-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 测试登录
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 邮件测试工具

推荐使用以下工具进行邮件测试：

- **MailHog**: 本地邮件测试服务器
- **Mailtrap**: 在线邮件测试服务
- **Gmail**: 使用真实邮箱测试

## 常见问题

### 1. 邮件发送失败

**可能原因**:
- SMTP 配置错误
- 邮箱密码错误
- 邮箱服务商安全限制

**解决方案**:
```bash
# 检查 SMTP 连接
telnet smtp.gmail.com 587

# 检查环境变量
echo $EMAIL_HOST
echo $EMAIL_USER
```

### 2. 邮件被标记为垃圾邮件

**解决方案**:
- 配置 SPF 记录
- 配置 DKIM 签名
- 使用认证的 SMTP 服务
- 优化邮件内容

### 3. 验证码不到达

**可能原因**:
- 邮件被过滤
- 邮箱地址错误
- 服务器时间不同步

**解决方案**:
- 检查垃圾邮件文件夹
- 验证邮箱地址格式
- 同步服务器时间

### 4. Gmail 应用密码配置

1. 登录 Google 账户
2. 进入账户设置 > 安全性
3. 启用两步验证
4. 生成应用密码
5. 使用应用密码替代普通密码

## 监控和日志

### 邮件发送日志

```javascript
// 记录邮件发送状态
console.log({
  type: 'email_sent',
  to: email,
  subject: subject,
  status: 'success',
  timestamp: new Date().toISOString()
})
```

### 发送统计

监控邮件发送情况：
- 发送成功率
- 发送失败原因
- 用户验证率
- 服务商性能
