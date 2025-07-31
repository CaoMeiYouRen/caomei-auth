# 抖音登录配置指南

抖音是字节跳动旗下的短视频平台，在中国和海外都有大量用户，适合内容和娱乐类应用。

## 前置要求

- 拥有抖音账户
- 需要在字节小程序开发者平台注册
- 需要完成开发者认证

## 配置步骤

### 1. 注册字节开发者账户

1. 访问 [字节小程序开发者平台](https://developer.open-douyin.com/)
2. 选择 **网站应用** 接入方式
3. 使用手机号或邮箱注册开发者账户
4. 完成身份认证（个人或企业）

### 2. 创建网站应用

1. 登录开发者平台
2. 选择 **应用管理** > **创建应用**
3. 选择应用类型：**网站应用**
4. 填写应用信息：
   - **应用名称**: `草梅Auth`
   - **应用简介**: 详细描述应用功能
   - **应用图标**: 上传应用图标
   - **应用分类**: 选择合适的应用分类
   - **网站地址**: `https://yourdomain.com`

### 3. 配置登录权限

1. 在应用详情页面，选择 **开发** > **接口权限**
2. 申请 **登录** 权限：
   - **user_info**: 获取用户公开信息
   - **login**: 用户登录授权
3. 填写权限申请理由
4. 提交申请等待审核

### 4. 设置回调地址

1. 在 **开发设置** 中配置：
   - **授权回调域**: `yourdomain.com`
   - **服务器域名**: `yourdomain.com`
2. 保存配置

### 5. 获取应用凭据

在应用详情页面获取：

- **Client Key**: 应用的客户端密钥
- **Client Secret**: 应用的服务端密钥

### 6. 配置环境变量

在项目的 `.env` 文件中添加：

```env
# 抖音登录配置
DOUYIN_CLIENT_ID=your_douyin_client_key
DOUYIN_CLIENT_SECRET=your_douyin_client_secret
```

### 7. 重启应用

保存环境变量后，重启应用以使配置生效。

## 权限范围

抖音登录可以获取以下用户信息：

### 基础权限
- 用户唯一标识 (open_id)
- 用户昵称
- 用户头像
- 用户性别
- 用户所在地区

### 扩展权限
- 用户抖音号
- 粉丝数量
- 关注数量
- 获赞数量
- 作品数量

## 授权范围说明

```javascript
// 可申请的权限范围
const scopes = [
  'user_info',        // 获取用户基本信息
  'video.list',       // 获取用户视频列表
  'video.data',       // 获取视频数据
  'fans.list',        // 获取粉丝列表
  'following.list',   // 获取关注列表
  'item.comment',     // 视频评论管理
  'data.external'     // 数据开放服务
];
```

## 测试登录

1. 访问登录页面
2. 点击抖音登录按钮
3. 在抖音授权页面使用抖音 APP 扫码
4. 在抖音 APP 中确认授权
5. 成功登录后会跳转回应用

## 登录流程

### Web 端授权流程

```javascript
// 1. 跳转到抖音授权页面
const authUrl = `https://open.douyin.com/platform/oauth/connect/?client_key=${clientKey}&response_type=code&scope=user_info&redirect_uri=${redirectUri}`;

// 2. 用户授权后获取 code
const code = new URLSearchParams(window.location.search).get('code');

// 3. 使用 code 换取 access_token
const tokenResponse = await fetch('https://open.douyin.com/oauth/access_token/', {
  method: 'POST',
  body: JSON.stringify({
    client_key: clientKey,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code'
  })
});

// 4. 使用 access_token 获取用户信息
const userResponse = await fetch('https://open.douyin.com/oauth/userinfo/', {
  method: 'POST',
  body: JSON.stringify({
    access_token: accessToken,
    open_id: openId
  })
});
```

## 常见问题

### 1. redirect_uri_mismatch

**原因**: 回调域名配置错误

**解决方案**:
- 检查开发者平台中配置的回调域名
- 确保域名完全匹配
- 不要包含协议和端口号

### 2. invalid_client_key

**原因**: Client Key 错误

**解决方案**:
- 检查环境变量中的 Client Key
- 确认应用状态正常
- 重新生成密钥

### 3. scope权限不足

**原因**: 申请的权限未通过审核

**解决方案**:
- 检查权限申请状态
- 补充权限申请材料
- 等待审核通过

### 4. access_token 过期

**原因**: 访问令牌已过期

**解决方案**:
- 实现 token 刷新机制
- 使用 refresh_token 获取新的 access_token
- 妥善处理过期情况

## 用户数据示例

```javascript
// 抖音用户信息结构
{
  error_code: 0,
  description: "success",
  data: {
    open_id: "69c3b896-6b4c-40dc-9f32-...",
    union_id: "69c3b896-6b4c-40dc-9f32-...",
    nickname: "用户昵称",
    avatar: "https://p3.pstatp.com/...",
    avatar_larger: "https://p3.pstatp.com/...",
    gender: 1, // 0:未知, 1:男, 2:女
    city: "北京",
    province: "北京",
    country: "中国",
    e_account_role: "personal" // personal:个人, business:企业
  }
}
```

## API 调用限制

### 频率限制

- **用户信息接口**: 100次/分钟
- **数据类接口**: 根据权限等级确定
- **内容管理接口**: 50次/分钟

### 权限等级

1. **基础权限**: 免费，有调用限制
2. **高级权限**: 需要审核，更高限额
3. **商业权限**: 付费服务，无限制

## 移动端适配

### H5 页面优化

```vue
<template>
  <div class="douyin-login">
    <!-- 移动端优化 -->
    <div v-if="isMobile" class="mobile-login">
      <button @click="loginWithDouyin" class="douyin-btn">
        <img src="/icons/douyin.svg" alt="抖音" />
        抖音登录
      </button>
      <p class="tip">将跳转到抖音 APP 进行授权</p>
    </div>
    
    <!-- PC端显示二维码 -->
    <div v-else class="qr-login">
      <div class="qr-code">
        <img :src="qrCodeUrl" alt="抖音登录二维码" />
      </div>
      <p>使用抖音APP扫一扫登录</p>
    </div>
  </div>
</template>
```

### APP 内嵌页面

如果页面在抖音 APP 内打开：

```javascript
// 检测是否在抖音 APP 内
function isDouyinApp() {
  return /aweme/i.test(navigator.userAgent);
}

// 抖音内使用 JSBridge
if (isDouyinApp()) {
  // 使用抖音提供的 JSBridge 进行授权
  tt.login({
    success: (res) => {
      // 处理登录成功
    },
    fail: (err) => {
      // 处理登录失败
    }
  });
}
```

## 数据安全

### Token 管理

```javascript
// Token 安全存储
class DouyinAuth {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }
  
  // 检查 token 是否有效
  isTokenValid() {
    return this.accessToken && Date.now() < this.expiresAt;
  }
  
  // 刷新 token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.callRefreshAPI(this.refreshToken);
    this.setTokens(response.access_token, response.refresh_token);
  }
}
```

### 用户隐私保护

1. **最小权限原则**: 只申请必要的权限
2. **数据加密**: 敏感信息加密存储
3. **定期清理**: 清理过期的用户数据
4. **用户控制**: 提供数据删除选项

## 商业化功能

### 数据分析

如果申请了数据权限，可以获取：

- 用户画像数据
- 内容偏好分析
- 互动行为数据
- 传播效果分析

### 内容管理

支持的内容操作：

- 获取用户视频列表
- 视频数据统计
- 评论管理
- 内容审核

## 品牌使用规范

使用抖音登录时的建议：

- **颜色**: 使用抖音官方红色 `#FE2C55`
- **图标**: 使用抖音官方音符图标
- **文案**: "抖音登录" 或 "使用抖音登录"
- **动效**: 可以添加音符跳动动效

### 品牌素材

```scss
// 抖音登录按钮样式
.douyin-login-btn {
  background: linear-gradient(45deg, #FE2C55, #FF4B7A);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '♪';
    position: absolute;
    right: 10px;
    animation: bounce 2s infinite;
  }
  
  &:hover {
    background: linear-gradient(45deg, #E02346, #FF4B7A);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
}
```

## 相关链接

- [字节小程序开发者平台](https://developer.open-douyin.com/)
- [抖音开放平台文档](https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/account-permission/get-account-open-info)
- [权限申请指南](https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/permission/list)
- [API 接口文档](https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/list)
