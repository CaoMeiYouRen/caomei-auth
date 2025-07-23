# QQ 登录配置指南

本指南将帮助您在草梅 Auth 中配置 QQ 登录功能。

## 前置要求

-   有效的 QQ 互联开发者账号
-   通过审核的应用
-   获得相应的 APP ID 和 APP KEY

## 配置步骤

### 1. 申请 QQ 互联开发者账号

1. 访问 [QQ 互联](https://connect.qq.com/)
2. 使用 QQ 账号登录
3. 完成开发者身份认证

### 2. 创建应用

1. 登录 QQ 互联后，进入 [应用管理](https://connect.qq.com/manage.html)
2. 点击"创建应用" > "网站应用"
3. 填写应用信息：
    - **应用名称**: 您的应用名称（如 "草梅 Auth"）
    - **应用描述**: 应用的详细描述
    - **网站地址**: 您的应用网站地址
    - **网站备案号**: 如果是中国大陆网站，需要填写备案号
4. 设置回调地址：
    - 本地开发：`http://localhost:3000/api/auth/oauth2/callback/qq`
    - 生产环境：`https://yourdomain.com/api/auth/oauth2/callback/qq`

### 3. 获取应用凭据

应用创建成功后，在应用详情页面可以获取：

-   **APP ID**: 应用唯一标识
-   **APP KEY**: 应用密钥

### 4. 申请 UnionID 权限（可选）

如果需要获取用户的 UnionID（用于多应用间的用户身份统一），需要：

1. 在应用管理页面申请 `get_union_id` 接口权限
2. 等待腾讯审核通过

### 5. 配置环境变量

在您的 `.env` 文件中添加以下配置：

```env
# QQ 登录配置
QQ_CLIENT_ID=your_qq_app_id         # QQ APP ID
QQ_CLIENT_SECRET=your_qq_app_key    # QQ APP KEY
QQ_REDIRECT_URI=http://localhost:3000/api/auth/oauth2/callback/qq # 本地开发
# QQ_REDIRECT_URI=https://yourdomain.com/api/auth/oauth2/callback/qq # 生产环境

# 可选：启用 UnionID（需要申请权限）
QQ_USE_UNIONID=true
```

### 6. 重启应用

配置完成后，重启您的应用以使配置生效。

## 使用 QQ 登录

### 前端使用

```vue
<template>
    <button @click="signInWithQQ">
        <i class="mdi mdi-qqchat"></i>
        使用 QQ 登录
    </button>
</template>

<script setup>
import { authClient } from "@/lib/auth-client";

const signInWithQQ = async () => {
    await authClient.signIn.social({
        provider: "qq",
    });
};
</script>
```

## 用户信息获取

QQ 登录可以获取以下用户信息：

| 字段             | 说明                           | 备注     |
| ---------------- | ------------------------------ | -------- |
| `openid`         | 用户在应用下的唯一标识         | -        |
| `unionid`        | 用户在腾讯开放平台下的唯一标识 | 需要权限 |
| `nickname`       | 用户昵称                       | -        |
| `figureurl_qq_1` | QQ 头像 URL（40×40）           | -        |
| `figureurl_qq_2` | QQ 头像 URL（100×100）         | -        |
| `gender`         | 性别                           | 男、女   |
| `province`       | 省份                           | -        |
| `city`           | 城市                           | -        |
| `year`           | 出生年                         | -        |

**注意**: QQ 登录默认不提供用户邮箱地址，系统会自动为用户生成临时邮箱。

## UnionID 说明

UnionID 是用户在腾讯开放平台下的唯一标识：

-   **作用**: 同一用户在不同应用下的 openid 不同，但 unionid 相同
-   **应用场景**: 多应用间的用户身份统一
-   **获取条件**: 需要申请 `get_union_id` 接口权限

## 故障排除

### 常见错误

1. **100016 - api_key 不存在**

    - 检查 APP ID 是否正确
    - 确认应用状态是否正常

2. **100001 - 参数错误**

    - 检查回调地址配置
    - 验证参数格式是否正确

3. **30801 - 应用未审核通过**
    - 确认应用已通过腾讯审核
    - 检查应用状态

### 调试步骤

1. 检查 QQ 互联应用配置
2. 验证环境变量设置
3. 查看浏览器开发者工具
4. 检查服务器日志

## QQ 品牌指南

使用 QQ 登录时，请遵循腾讯品牌指南：

-   **品牌色**: 使用 QQ 红色 `#ea1b26`
-   **图标**: 使用官方提供的 QQ 图标
-   **按钮文案**: 建议使用 "QQ 登录" 或 "使用 QQ 账号登录"

## 参考资料

-   [QQ 互联](https://connect.qq.com/)
-   [QQ 互联开发文档](https://wiki.connect.qq.com/)
-   [OAuth2.0 简介](https://wiki.connect.qq.com/oauth2-0%E7%AE%80%E4%BB%8B)
