# 短信登录配置

短信登录提供基于手机号的认证方式，支持手机号+密码登录和短信验证码登录。

> **📌 当前实现状态**:
>
> -   ✅ **已实现**: Spug 短信平台（仅支持中国大陆手机号）
> -   ✅ **已实现**: Twilio 短信平台（支持全球手机号）
> -   🚧 **计划中**: 阿里云短信、腾讯云短信（支持国际号码）
> -   💡 **扩展**: 可自行参考代码实现其他短信平台

## 功能特性

-   **手机号密码登录**: 传统的手机号+密码登录方式
-   **短信验证码登录**: 无需密码，通过短信验证码登录
-   **手机号验证**: 新用户注册时手机号验证
-   **密码重置**: 通过短信重置密码

## 环境变量配置

### 基础短信配置

```env
# 启用短信功能
NUXT_PUBLIC_PHONE_ENABLED=true

# 短信服务配置
PHONE_SENDER_NAME="草梅Auth"          # 短信发送者名称
PHONE_EXPIRES_IN=300                 # 验证码有效时间（秒）
PHONE_CHANNEL=twilio                 # 短信渠道：spug 或 twilio
```

### 限流配置

```env
# 短信发送限制
PHONE_DAILY_LIMIT=100                    # 全局每日短信发送上限
PHONE_SINGLE_USER_DAILY_LIMIT=3         # 单个手机号每日验证码发送上限
```

## 支持的短信服务商

> **📋 当前状态**: 目前支持 Spug 和 Twilio 两个短信平台，其他平台正在计划开发中。

### Spug 短信服务（已实现）

Spug 是一个中国的短信服务提供商，提供稳定可靠的短信发送服务。

> **⚠️ 重要说明**: Spug 平台目前仅支持中国大陆手机号（+86），不支持国际手机号。

#### 配置步骤

1. 注册 [Spug 账户](https://push.spug.cc)
2. 创建短信应用
3. 配置短信模板
4. 获取模板 ID

```env
PHONE_CHANNEL=spug
SPUG_TEMPLATE_ID=your-template-id
```

#### 支持范围

-   ✅ 中国大陆手机号 (+86)
-   ❌ 国际手机号

#### 短信模板格式

推荐的短信模板：

```
${key1}欢迎您，您的验证码为${key2}，${key3}分钟内有效，如非本人操作请忽略。
```

模板变量说明：

-   `${key1}`: 应用名称（自动填充）
-   `${key2}`: 验证码（自动生成）
-   `${key3}`: 有效时间（自动计算）

### Twilio 短信服务（已实现）

Twilio 是一个全球领先的云通信平台，支持全球范围内的短信发送服务。

> **🌍 国际化支持**: Twilio 支持全球手机号，是国际化应用的理想选择。

#### 配置步骤

1. 注册 [Twilio 账户](https://www.twilio.com)
2. 获取 Account SID 和 Auth Token
3. 购买或申请 Twilio 手机号

```env
PHONE_CHANNEL=twilio
TWILIO_ACCOUNT_SID=你的AccountSID
TWILIO_AUTH_TOKEN=你的AuthToken
TWILIO_PHONE_NUMBER=你的Twilio手机号（如+12312345678）
```

#### 支持范围

-   ✅ 中国大陆手机号 (+86)
-   ✅ 国际手机号（全球支持）

#### 短信内容格式

短信内容会自动生成，格式如下：

```
{PHONE_SENDER_NAME}欢迎您，您的验证码为{code}，{expiresInMinutes}分钟内有效，如非本人操作请忽略。
```

例如：

```
草梅Auth欢迎您，您的验证码为123456，5分钟内有效，如非本人操作请忽略。
```

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

-   ✅ 中国大陆手机号 (+86)
-   ✅ 国际手机号（需要开通国际短信服务）

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

-   ✅ 中国大陆手机号 (+86)
-   ✅ 国际手机号（需要开通国际短信服务）

## 服务商选择建议

根据您的业务需求选择合适的短信服务商：

| 服务商 | 实现状态  | 中国大陆 | 国际支持 | 价格 | 推荐场景           |
| ------ | --------- | -------- | -------- | ---- | ------------------ |
| Spug   | ✅ 已实现 | ✅       | ❌       | 较低 | 仅服务中国大陆用户 |
| Twilio | ✅ 已实现 | ✅       | ✅       | 中等 | 需要国际化支持     |
| 阿里云 | 🚧 计划中 | ✅       | ✅       | 中等 | 需要国际化支持     |
| 腾讯云 | 🚧 计划中 | ✅       | ✅       | 中等 | 需要国际化支持     |

> **💡 扩展提示**: 如您需要使用其他短信服务商，可以参考 `server/utils/phone.ts` 中的 Spug 和 Twilio 实现，添加新的 case 分支来扩展支持。

### 服务商推荐

#### 国内用户推荐

如果您的应用主要服务于中国大陆用户：

-   **首选 Spug**: 成本较低，专为国内市场设计
-   **备选 Twilio**: 虽然成本稍高，但提供更好的稳定性和技术支持

#### 国际用户推荐

如果您的应用需要支持国际用户：

-   **强烈推荐 Twilio**: 全球覆盖，支持 200+国家和地区
-   **等待阿里云/腾讯云**: 如需更好的成本控制，可等待国内云服务商的国际短信功能

#### 企业用户推荐

如果您是企业用户，有较高的稳定性和合规要求：

-   **Twilio**: 企业级稳定性，完善的 API 和文档
-   **阿里云/腾讯云**: 国内合规要求更友好，等待实现中

## 手机号格式支持

### 中国大陆

支持标准的中国大陆手机号格式：

```javascript
// 支持的格式
const validFormats = [
    "138****8888", // 11位数字
    "+86138****8888", // 国际格式
    "86-138-****-8888", // 带分隔符
];
```

### 国际号码

现在支持 Twilio 短信服务商，可以发送国际手机号码。

```javascript
// 国际号码格式示例（Twilio 支持）
const internationalFormats = [
    "+1-555-123-4567", // 美国（保留，通用测试号码）
    "+44-20-1234-5678", // 英国
    "+81-90-1234-5678", // 日本
    "+86-138-****-8888", // 中国
];
```

> **💡 提示**: 使用 Twilio 时，请确保手机号码包含正确的国家代码（如 +1, +86 等）。

## 前端集成

### 手机号密码登录

```vue
<template>
    <form @submit.prevent="loginWithPhone">
        <div class="form-group">
            <label>手机号</label>
            <phone-input v-model="phone" required placeholder="请输入手机号" />
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
            {{ isLoading ? "登录中..." : "登录" }}
        </button>
    </form>
</template>

<script setup>
import { authClient } from "@/lib/auth-client";

const phone = ref("");
const password = ref("");
const isLoading = ref(false);

const loginWithPhone = async () => {
    isLoading.value = true;
    try {
        await authClient.signIn.phone({
            phone: phone.value,
            password: password.value,
        });
        await navigateTo("/");
    } catch (error) {
        console.error("登录失败:", error);
    } finally {
        isLoading.value = false;
    }
};
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
                {{ countdown > 0 ? `${countdown}秒后重发` : "重新发送" }}
            </button>
        </div>
    </form>
</template>

<script setup>
import { authClient } from "@/lib/auth-client";

const phone = ref("");
const code = ref("");
const step = ref(1); // 1: 发送验证码, 2: 输入验证码
const isLoading = ref(false);
const countdown = ref(0);

const buttonText = computed(() => {
    if (isLoading.value) return "处理中...";
    return step.value === 1 ? "发送验证码" : "登录";
});

const sendSmsCode = async () => {
    isLoading.value = true;
    try {
        await $fetch("/api/auth/send-phone-code", {
            method: "POST",
            body: { phone: phone.value },
        });
        step.value = 2;
        startCountdown();
    } catch (error) {
        console.error("发送验证码失败:", error);
    } finally {
        isLoading.value = false;
    }
};

const loginWithSmsCode = async () => {
    isLoading.value = true;
    try {
        await authClient.signIn.phoneCode({
            phone: phone.value,
            code: code.value,
        });
        await navigateTo("/");
    } catch (error) {
        console.error("登录失败:", error);
    } finally {
        isLoading.value = false;
    }
};

const startCountdown = () => {
    countdown.value = 60;
    const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            clearInterval(timer);
        }
    }, 1000);
};
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

项目使用 `google-libphonenumber` 和 `validator` 库进行手机号验证和格式化，提供更准确的国际化支持。

```typescript
import { validatePhone } from "@/utils/validate";
import {
    formatPhoneNumber,
    formatPhoneNumberInternational,
} from "@/utils/phone";

// 手机号格式验证（使用 validator 库）
// 支持全球手机号格式，使用严格模式（必须包含国家代码）
export function validatePhoneNumber(phone: string): boolean {
    return validatePhone(phone, "any"); // 'any' 表示支持所有国家的手机号格式
}

// 验证特定国家的手机号
export function validatePhoneByCountry(
    phone: string,
    locale: "zh-CN" | "en-US" | "en-GB" | "ja-JP"
): boolean {
    return validatePhone(phone, locale);
}

// 格式化手机号到 E164 格式（用于数据库存储）
// 例如: +12024561414
export function formatPhoneForStorage(phone: string, region?: string): string {
    return formatPhoneNumber(phone, region);
}

// 格式化手机号到国际格式（用于展示给用户）
// 例如: +1 202-456-1414
export function formatPhoneForDisplay(phone: string, region?: string): string {
    return formatPhoneNumberInternational(phone, region);
}

// 示例用法
const phoneNumber = "+86138****8888";

// 验证手机号格式
if (validatePhoneNumber(phoneNumber)) {
    // 格式化为存储格式
    const storageFormat = formatPhoneForStorage(phoneNumber);
    console.log("存储格式:", storageFormat); // +86138****8888

    // 格式化为显示格式
    const displayFormat = formatPhoneForDisplay(phoneNumber);
    console.log("显示格式:", displayFormat); // +86 138 **** 8888
}
```

### 实际项目中的用法

参考项目中 `utils/validate.ts` 和 `utils/phone.ts` 的实现：

```typescript
// 从 utils/validate.ts 导入验证函数
import { validatePhone } from "@/utils/validate";

// 从 utils/phone.ts 导入格式化函数
import {
    formatPhoneNumber,
    formatPhoneNumberInternational,
    getRegionCodeForPhoneNumber,
} from "@/utils/phone";

// 验证手机号（严格模式，必须包含国家代码）
const isValidPhone = validatePhone("+86138****8888", "any");

// 格式化到 E164 格式（数据库存储）
const e164Format = formatPhoneNumber("+86138****8888");

// 格式化到国际显示格式
const internationalFormat = formatPhoneNumberInternational("+86138****8888");

// 获取手机号的区域代码
const regionCode = getRegionCodeForPhoneNumber("+86138****8888"); // 'CN'
```

## 常见问题

### 1. 短信发送失败

**可能原因**:

-   手机号格式错误
-   短信服务商配置错误
-   账户余额不足
-   短信内容被拦截
-   尝试发送国际手机号（目前仅支持中国大陆号码）

**解决方案**:

```bash
# 检查手机号格式
echo "手机号: $PHONE_NUMBER"

# 验证短信服务配置
curl -X POST https://api.spug.cc/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "138****8888", "template_id": "123456"}'

# 注意：目前仅支持中国大陆手机号，国际短信需要等待其他服务商接入
```

### 2. 验证码未收到

**可能原因**:

-   手机信号问题
-   短信被拦截
-   运营商延迟
-   手机设置问题

**解决方案**:

-   检查手机信号和设置
-   联系运营商客服
-   使用备用验证方式

### 3. 验证码过期

**解决方案**:

```env
# 调整验证码有效期
PHONE_EXPIRES_IN=600  # 延长到10分钟
```

### 4. 短信成本过高

**优化方案**:

-   使用图形验证码预过滤
-   实施更严格的发送限制
-   选择性价比更高的服务商
-   优化短信模板内容

## 测试和调试

### 开发环境测试

```bash
# 测试短信发送API
curl -X POST http://localhost:3000/api/auth/send-phone-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+86138****8888"}'

# 测试手机号登录
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+86138****8888",
    "password": "password123"
  }'
```

### 测试工具

-   **模拟器测试**: 使用模拟手机号进行测试
-   **真机测试**: 使用真实手机号验证完整流程
-   **压力测试**: 测试并发发送能力

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
```

## 常见问题解答 (FAQ)

### Twilio 相关问题

**Q: Twilio 手机号码格式有什么要求？**
A: Twilio 要求手机号码必须包含国家代码，格式如 `+86138****8888` 或 `+15551234567`。

**Q: 如何获取 Twilio 的 Account SID 和 Auth Token？**
A:

1. 登录 [Twilio Console](https://console.twilio.com/)
2. 在控制台首页可以找到 Account SID
3. Auth Token 在同一页面，可能需要点击"查看"来显示

**Q: Twilio 手机号码如何获取？**
A:

1. 在 Twilio Console 中进入 Phone Numbers 页面
2. 点击 "Buy a number" 购买新号码
3. 选择支持 SMS 功能的号码
4. 配置到 `TWILIO_PHONE_NUMBER` 环境变量

**Q: Twilio 短信发送失败，如何排查？**
A:

1. 检查环境变量配置是否完整
2. 确认 Twilio 账户余额充足
3. 验证目标手机号码格式正确（包含国家代码）
4. 查看服务器日志获取详细错误信息

### Spug 相关问题

**Q: Spug 和 Twilio 哪个更适合？**
A:

-   如果只服务中国用户且注重成本，选择 Spug
-   如果需要国际化支持或更好的稳定性，选择 Twilio

**Q: 可以同时配置多个短信服务商吗？**
A: 目前不支持，只能通过 `PHONE_CHANNEL` 指定一个服务商。如有需求，可以自行扩展实现故障切换功能。

### 通用问题

**Q: 短信验证码没有收到怎么办？**
A:

1. 检查手机号码格式是否正确
2. 确认短信服务商配置无误
3. 查看服务器日志是否有错误信息
4. 检查是否触发了发送频率限制

**Q: 如何调整短信发送频率限制？**
A: 可以通过以下环境变量调整：

```env
PHONE_DAILY_LIMIT=100                    # 全局每日限制
PHONE_SINGLE_USER_DAILY_LIMIT=3         # 单用户每日限制
PHONE_LIMIT_WINDOW=86400                 # 限制窗口（秒）
```

**Q: 如何自定义短信内容？**
A:

-   **Spug**: 在 Spug 平台配置短信模板
-   **Twilio**: 修改 `server/utils/phone.ts` 中的 `messageBody` 变量

## 开发和测试

### 测试配置

在开发环境中测试短信功能：

```env
# 开发环境配置示例
NODE_ENV=development
PHONE_CHANNEL=twilio
TWILIO_ACCOUNT_SID=your-test-account-sid
TWILIO_AUTH_TOKEN=your-test-auth-token
TWILIO_PHONE_NUMBER=+12312345678
PHONE_DAILY_LIMIT=10
PHONE_SINGLE_USER_DAILY_LIMIT=5
```

### 调试技巧

1. **开启日志**: 确保日志级别设置为 `debug` 或更低
2. **检查网络**: 确认服务器可以访问短信服务商的 API
3. **验证配置**: 使用 `server/utils/twilio-sms.ts` 中的 `getTwilioConfigStatus()` 函数检查配置状态

### 单独测试 Twilio 功能

可以创建一个简单的测试脚本来验证 Twilio 配置：

```typescript
// test-twilio.ts
import { sendSms, getTwilioConfigStatus } from "./server/utils/twilio-sms";

async function testTwilio() {
    // 检查配置状态
    const status = getTwilioConfigStatus();
    console.log("Twilio 配置状态:", status);

    if (status.isConfigured) {
        try {
            const result = await sendSms("+86138****0000", "测试短信");
            console.log("发送成功:", result);
        } catch (error) {
            console.error("发送失败:", error);
        }
    } else {
        console.log("Twilio 配置不完整");
    }
}

testTwilio();
```

## 贡献和扩展

如果您想要添加新的短信服务商支持，欢迎提交 Pull Request！请参考现有的 Spug 和 Twilio 实现，确保：

1. 添加相应的环境变量配置
2. 在 `server/utils/phone.ts` 中添加新的 case 分支
3. 更新文档说明
4. 添加适当的错误处理和日志记录
5. 进行充分的测试

---

> **🎯 总结**: 草梅 Auth 现已支持 Spug（国内）和 Twilio（国际）两个短信平台，能够满足不同地区和规模的应用需求。选择合适的服务商，正确配置环境变量，即可快速启用短信验证功能。

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

````

3. **更新手机号验证**

如果新服务商支持国际号码，可能需要调整 `validatePhone` 函数的逻辑。

4. **添加配置验证**

在 `utils/env.ts` 中添加新的环境变量：

```typescript
export const NEW_PROVIDER_API_KEY = getEnv('NEW_PROVIDER_API_KEY')
export const NEW_PROVIDER_SECRET = getEnv('NEW_PROVIDER_SECRET')
export const NEW_PROVIDER_TEMPLATE_ID = getEnv('NEW_PROVIDER_TEMPLATE_ID')
````

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

-   明确告知短信使用目的
-   获得用户明确同意
-   提供退订机制
-   安全存储手机号数据

### 反垃圾短信

-   实施发送频率限制
-   提供明确的退订方式
-   避免发送营销短信
-   遵守当地法律法规
