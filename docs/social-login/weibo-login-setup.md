# 微博登录配置指南

本指南将帮助您在草梅 Auth 中配置微博登录功能。

## 前置要求

-   有效的微博开放平台开发者账号
-   通过审核的应用
-   获得相应的 App Key 和 App Secret

## 配置步骤

### 1. 申请微博开放平台账号

1. 访问 [微博开放平台](https://open.weibo.com/)
2. 使用微博账号登录或注册开发者账号
3. 完成开发者身份认证

### 2. 创建应用

1. 登录微博开放平台后，进入 [我的应用](https://open.weibo.com/apps)
2. 点击"创建应用" > "网站接入"
3. 填写应用信息：
    - **应用名称**: 您的应用名称（如 "草梅 Auth"）
    - **应用描述**: 应用的详细描述
    - **应用网址**: 您的应用网站地址
    - **应用分类**: 选择合适的应用分类
4. 设置授权回调页：
    - 本地开发：`http://localhost:3000/api/auth/oauth2/callback/weibo`
    - 生产环境：`https://yourdomain.com/api/auth/oauth2/callback/weibo`

### 3. 获取应用凭据

应用创建成功后，在应用详情页面可以获取：

-   **App Key**: 应用唯一标识
-   **App Secret**: 应用密钥

### 4. 申请高级权限（可选）

如果需要获取用户邮箱地址，需要申请以下权限：

-   `email` 权限：获取用户邮箱地址

### 5. 配置环境变量

在您的 `.env` 文件中添加以下配置：

```env
# 微博登录配置
WEIBO_CLIENT_ID=your_weibo_app_key      # 微博 App Key
WEIBO_CLIENT_SECRET=your_weibo_app_secret # 微博 App Secret
WEIBO_REDIRECT_URI=http://localhost:3000/api/auth/oauth2/callback/weibo # 本地开发
# WEIBO_REDIRECT_URI=https://yourdomain.com/api/auth/oauth2/callback/weibo # 生产环境

# 可选：邮箱权限（需要单独申请）
WEIBO_SCOPES=email
```

### 6. 重启应用

配置完成后，重启您的应用以使配置生效。

## 使用微博登录

### 前端使用

```vue
<template>
    <button @click="signInWithWeibo">
        <i class="mdi mdi-sina-weibo"></i>
        使用微博登录
    </button>
</template>

<script setup>
import { authClient } from "@/lib/auth-client";

const signInWithWeibo = async () => {
    await authClient.signIn.social({
        provider: "weibo",
    });
};
</script>
```

## 用户信息获取

微博登录可以获取以下用户信息：

| 字段              | 说明             | 备注                  |
| ----------------- | ---------------- | --------------------- |
| `idstr`           | 用户 ID 字符串   | 唯一标识              |
| `screen_name`     | 用户昵称         | -                     |
| `avatar_large`    | 用户头像（大图） | 180×180 像素          |
| `email`           | 邮箱地址         | 需要申请权限          |
| `gender`          | 性别             | m：男，f：女，n：未知 |
| `location`        | 地理位置         | 用户资料填写的地址    |
| `description`     | 个人描述         | -                     |
| `followers_count` | 粉丝数           | -                     |
| `friends_count`   | 关注数           | -                     |

## 故障排除

### 常见错误

1. **21301 - invalid appkey**

    - 检查 App Key 是否正确
    - 确认应用状态是否正常

2. **21325 - invalid redirect_uri**

    - 检查回调地址配置
    - 确保回调地址与应用设置一致

3. **21315 - invalid scope**
    - 检查申请的权限范围
    - 确认已获得相应权限

## 参考资料

-   [微博开放平台](https://open.weibo.com/)
-   [微博 OAuth2.0 授权机制](https://open.weibo.com/wiki/授权机制说明)
-   [微博 API 文档](https://open.weibo.com/wiki/微博API)
