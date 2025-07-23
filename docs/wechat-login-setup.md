# 微信登录配置指南

本指南将帮助您在草梅 Auth 中配置微信登录功能。微信登录基于 OAuth2.0 协议，支持网站应用的微信扫码登录。

## 前置要求

-   有效的微信开放平台开发者账号
-   通过微信开放平台审核的网站应用
-   获得相应的 AppID 和 AppSecret

## 配置步骤

### 1. 申请微信开放平台账号

1. 访问 [微信开放平台](https://open.weixin.qq.com/)
2. 使用微信扫码登录或注册开发者账号
3. 完成开发者资质认证（个人或企业）

### 2. 创建网站应用

1. 登录微信开放平台后，进入 [管理中心](https://open.weixin.qq.com/cgi-bin/index)
2. 选择"网站应用" > "创建应用"
3. 填写应用信息：
    - **应用名称**: 您的应用名称（如 "草梅 Auth"）
    - **应用描述**: 应用的详细描述
    - **应用官网**: 您的应用官网地址
    - **应用 Logo**: 上传应用图标（120x120px）
4. 设置授权回调域：
    - 本地开发：`localhost:3000`
    - 生产环境：`yourdomain.com`（不包含 `http://` 或 `https://`）

### 3. 申请微信登录功能

1. 在应用详情页面，点击"申请开通" > "微信登录"
2. 填写接口权限申请表
3. 等待微信官方审核（通常需要 1-7 个工作日）

### 4. 获取应用凭据

审核通过后，在应用详情页面可以获取：

-   **AppID**: 应用唯一标识
-   **AppSecret**: 应用密钥（请妥善保管）

### 5. 配置环境变量

在您的 `.env` 文件中添加以下配置：

```env
# 微信登录配置
WECHAT_APP_ID=your_wechat_app_id          # 微信 AppID
WECHAT_APP_SECRET=your_wechat_app_secret  # 微信 AppSecret
WECHAT_REDIRECT_URI=http://localhost:3000/api/auth/oauth2/callback/wechat  # 本地开发
# WECHAT_REDIRECT_URI=https://yourdomain.com/api/auth/oauth2/callback/wechat  # 生产环境
```

### 6. 重启应用

配置完成后，重启您的应用以使配置生效。

## 使用微信登录

### 前端使用

在登录页面，用户可以看到微信登录按钮。点击后会跳转到微信的二维码扫码页面。

```vue
<template>
    <button @click="signInWithWeChat">
        <i class="mdi mdi-wechat"></i>
        使用微信登录
    </button>
</template>

<script setup>
import { authClient } from "@/lib/auth-client";

const signInWithWeChat = async () => {
    await authClient.signIn.social({
        provider: "wechat",
    });
};
</script>
```

### 登录流程

1. **用户点击微信登录按钮**
2. **跳转到微信授权页面**: 显示二维码供用户扫码
3. **微信扫码确认**: 用户使用微信扫描二维码并确认授权
4. **获取授权码**: 微信返回授权码（code）
5. **交换访问令牌**: 应用使用授权码交换 access_token
6. **获取用户信息**: 使用 access_token 获取用户基本信息
7. **完成登录**: 创建或更新用户账号，完成登录流程

## 回调 URL 配置

确保在微信开放平台中配置的授权回调域与您的应用完全匹配：

-   **开发环境**: `localhost:3000`
-   **生产环境**: `yourdomain.com`

对应的完整回调 URL：

-   **开发环境**: `http://localhost:3000/api/auth/oauth2/callback/wechat`
-   **生产环境**: `https://yourdomain.com/api/auth/oauth2/callback/wechat`

## 用户信息获取

微信登录可以获取以下用户信息：

| 字段         | 说明                           | 备注                            |
| ------------ | ------------------------------ | ------------------------------- |
| `openid`     | 用户在该应用下的唯一标识       | -                               |
| `unionid`    | 用户在微信开放平台下的唯一标识 | 仅当应用拥有 UnionID 权限时返回 |
| `nickname`   | 用户昵称                       | -                               |
| `headimgurl` | 用户头像 URL                   | 有多种尺寸可选                  |
| `sex`        | 用户性别                       | 1 为男性，2 为女性              |
| `province`   | 用户所在省份                   | 根据隐私设置可能为空            |
| `city`       | 用户所在城市                   | 根据隐私设置可能为空            |
| `country`    | 用户所在国家                   | 如中国为 CN                     |

**注意**: 微信登录不提供用户邮箱地址，系统会自动为用户生成临时邮箱。

## 快速登录功能

对于 Windows/Mac 用户，如果已经登录微信客户端，可以享受快速登录功能：

-   **支持版本**: 微信 3.9.11 for Windows 及以上版本，微信 4.0.0 for Mac 及以上版本
-   **无需扫码**: 直接在客户端确认登录
-   **快速便捷**: 大幅提升登录体验

## 故障排除

### 常见错误

1. **invalid_client**

    - 检查 AppID 是否正确
    - 确认应用状态是否正常

2. **redirect_uri_mismatch**

    - 检查回调域配置是否正确
    - 确保回调 URL 格式正确

3. **scope_error**

    - 确认应用已申请微信登录权限
    - 检查权限申请状态

4. **access_denied**
    - 用户拒绝授权
    - 检查应用信息是否完整

### 调试步骤

1. 检查微信开放平台应用配置
2. 验证环境变量是否正确设置
3. 查看浏览器开发者工具中的网络请求
4. 检查服务器日志中的错误信息
5. 确认回调域名配置正确

## 微信品牌指南

使用微信登录时，请遵循微信品牌指南：

-   **品牌色**: 使用微信绿色 `#07c160`
-   **图标**: 使用官方提供的微信图标
-   **按钮文案**: 建议使用 "微信登录" 或 "使用微信账号登录"

## API 限制和注意事项

1. **访问频率限制**: 微信 API 有调用频率限制，请注意控制调用频率
2. **用户隐私**: 根据用户隐私设置，部分信息（如地理位置）可能无法获取
3. **头像 URL**: 微信头像 URL 可能会失效，建议本地保存用户头像
4. **UnionID**: 如需获取 UnionID，需要向微信申请相应权限

## 生产环境部署

1. **HTTPS 要求**: 生产环境必须使用 HTTPS
2. **域名验证**: 确保域名已在微信开放平台验证
3. **AppSecret 安全**: 妥善保管 AppSecret，不要暴露在客户端
4. **监控告警**: 建议对微信登录接口进行监控和告警

## 参考资料

-   [微信开放平台](https://open.weixin.qq.com/)
-   [网站应用微信登录开发指南](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
-   [微信 OAuth2.0 授权登录](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Authorized_Interface_Calling_UnionID.html)
-   [微信开放平台接口调用频率限制](https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/api/api_get_authorizer_info.html)
