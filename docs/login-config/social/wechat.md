# 微信登录配置指南

微信是中国最大的社交平台和支付工具，拥有超过10亿活跃用户，是中国应用必备的登录方式。

## 前置要求

- 拥有微信账户
- 需要在微信开放平台注册开发者账户
- 需要完成开发者认证（企业认证）

## 配置步骤

### 1. 注册微信开放平台账户

1. 访问 [微信开放平台](https://open.weixin.qq.com/)
2. 点击 **注册** 创建开发者账户
3. 完成企业认证：
   - **认证类型**: 企业认证（个人无法申请微信登录）
   - **认证费用**: 300元/年
   - **所需资料**: 营业执照、对公账户等
4. 等待认证审核（通常3-7个工作日）

### 2. 创建网站应用

认证通过后：

1. 登录微信开放平台管理后台
2. 选择 **管理中心** > **网站应用** > **创建网站应用**
3. 填写应用信息：
   - **应用名称**: `草梅Auth`
   - **应用简介**: 详细描述应用功能
   - **应用官网**: `https://yourdomain.com`
   - **应用图标**: 上传应用图标（120x120px）
   - **授权回调域**: `yourdomain.com`（不包含协议和路径）

### 3. 应用审核

提交应用后：

1. 微信团队会进行审核（通常7-15个工作日）
2. 审核期间可能需要补充材料
3. 审核通过后获得 AppID 和 AppSecret

### 4. 获取应用凭据

审核通过后，在应用详情页面获取：

- **AppID**: 应用唯一标识
- **AppSecret**: 应用密钥

### 5. 配置环境变量

在项目的 `.env` 文件中添加：

```env
# 微信登录配置
WECHAT_CLIENT_ID=your_wechat_appid
WECHAT_CLIENT_SECRET=your_wechat_appsecret
```

### 6. 重启应用

保存环境变量后，重启应用以使配置生效。

## 权限范围

微信登录可以获取以下用户信息：

### 基础信息（snsapi_base）
- 用户 OpenID
- 用户 UnionID（如果账号绑定了开放平台）

### 用户信息（snsapi_userinfo）
- 昵称
- 头像
- 性别
- 所在国家、省份、城市
- 语言
- 关注状态

## OpenID vs UnionID

### OpenID
- **说明**: 用户在单个应用内的唯一标识
- **特点**: 每个应用获得的 OpenID 不同
- **使用**: 适合单一应用场景

### UnionID
- **说明**: 用户在同一开发者所有应用的统一标识
- **获取条件**: 
  - 应用已绑定到微信开放平台
  - 用户已关注应用对应的公众号
- **使用**: 适合多应用生态系统

## 测试登录

1. 访问登录页面
2. 点击微信登录按钮
3. 使用微信扫描二维码
4. 在微信中确认授权
5. 成功登录后会跳转回应用

## 二维码登录流程

```javascript
// 微信登录流程
1. 用户点击微信登录按钮
2. 页面跳转到微信授权页面
3. 显示二维码，用户使用微信扫描
4. 用户在微信中确认授权
5. 微信回调到指定地址
6. 应用获取 code 并换取 access_token
7. 使用 access_token 获取用户信息
```

## 移动端适配

### 在微信内打开

如果网页在微信内打开，可以使用网页授权：

```javascript
// 判断是否在微信内
function isWeiXin() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

// 微信内网页授权
if (isWeiXin()) {
  // 使用网页授权方式
  window.location.href = wechatAuthUrl;
} else {
  // 使用扫码登录方式
  showQRCode();
}
```

### 移动端优化

```vue
<template>
  <div class="wechat-login">
    <!-- 移动端显示提示 -->
    <div v-if="isMobile" class="mobile-tip">
      <p>请在微信中打开此页面进行登录</p>
      <button @click="openInWechat">在微信中打开</button>
    </div>
    
    <!-- PC端显示二维码 -->
    <div v-else class="qr-code">
      <img :src="qrCodeUrl" alt="微信登录二维码" />
      <p>使用微信扫一扫登录</p>
    </div>
  </div>
</template>
```

## 常见问题

### 1. redirect_uri 参数错误

**原因**: 回调域名配置错误

**解决方案**:
- 检查微信开放平台中配置的授权回调域
- 确保域名正确且已备案
- 不要包含协议（http/https）和端口号

### 2. invalid_client

**原因**: AppID 或 AppSecret 错误

**解决方案**:
- 检查环境变量配置
- 确认 AppID 和 AppSecret 正确
- 注意区分网站应用和公众号应用的凭据

### 3. 40029 错误

**原因**: invalid code, 授权码 code 无效

**解决方案**:
- code 只能使用一次，不能重复使用
- code 有效期为 10 分钟
- 检查 code 是否正确获取

### 4. 40125 错误

**原因**: invalid appsecret, AppSecret 错误

**解决方案**:
- 检查 AppSecret 是否正确
- 重新生成 AppSecret
- 注意保密性，不要泄露

## 用户数据示例

```javascript
// 微信用户信息结构
{
  openid: "o6_bmjrPTlm6_2sgVt7hMZOPfL2M",
  unionid: "o6_bmasdasdsad6_2sgVt7hMZOPfL",
  nickname: "用户昵称",
  sex: 1, // 1:男性，2:女性，0:未知
  language: "zh_CN",
  city: "北京",
  province: "北京",
  country: "中国",
  headimgurl: "http://thirdwx.qlogo.cn/...",
  privilege: [], // 用户特权信息
  subscribe: 1, // 是否关注公众号
  subscribe_time: 1382694957,
  remark: "", // 公众号运营者对粉丝的备注
  groupid: 0, // 用户所在的分组ID
  tagid_list: [] // 用户被打上的标签ID列表
}
```

## 品牌使用规范

使用微信登录时的要求：

- **颜色**: 使用微信官方绿色 `#07C160`
- **图标**: 使用微信官方图标
- **文案**: "微信登录" 或 "使用微信登录"
- **二维码**: 使用微信官方二维码样式

### 设计规范

```scss
// 微信登录按钮样式
.wechat-login-btn {
  background-color: #07C160;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  
  &:hover {
    background-color: #06AD56;
  }
  
  .icon {
    margin-right: 8px;
    width: 20px;
    height: 20px;
  }
}
```

## 高级功能

### 获取用户详细信息

```javascript
// 获取用户详细信息（需要 snsapi_userinfo 权限）
const userInfo = await wechatAPI.getUserInfo(accessToken, openid);
```

### 检查 Token 有效性

```javascript
// 检查访问令牌是否有效
const isValid = await wechatAPI.checkToken(accessToken, openid);
```

### 刷新访问令牌

```javascript
// 刷新访问令牌
const newToken = await wechatAPI.refreshToken(refreshToken);
```

## 安全注意事项

### Token 安全

1. **服务端存储**: Access Token 应存储在服务端
2. **定期刷新**: 使用 Refresh Token 定期刷新
3. **过期处理**: 妥善处理 Token 过期情况

### 用户隐私

1. **最小权限**: 只申请必要的用户信息
2. **数据加密**: 敏感信息加密存储
3. **用户控制**: 提供数据删除和修改选项

## 开发调试

### 测试环境

微信提供测试环境：

1. **开发者工具**: 微信开发者工具
2. **测试账号**: 申请测试账号
3. **本地调试**: 使用内网穿透工具

### 调试技巧

```javascript
// 开发环境调试
if (process.env.NODE_ENV === 'development') {
  console.log('微信授权码:', code);
  console.log('用户信息:', userInfo);
}

// 错误处理
try {
  const userInfo = await wechatAPI.getUserInfo(accessToken, openid);
} catch (error) {
  console.error('获取微信用户信息失败:', error);
  // 处理错误逻辑
}
```

## 相关链接

- [微信开放平台](https://open.weixin.qq.com/)
- [网站应用微信登录开发指南](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
- [微信登录能力](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/WeChat_Login.html)
- [错误码说明](https://developers.weixin.qq.com/doc/oplatform/Return_codes/Return_code_descriptions_new.html)
