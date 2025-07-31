# 快速开始指南

本指南将帮助您在 5 分钟内完成草梅 Auth 的基本集成。

## 第一步：创建应用

1. 登录草梅 Auth 管理后台
2. 进入 [应用管理](/oauth/clients) 页面
3. 点击"新建应用"按钮
4. 填写应用信息：
   - **应用名称**：您的应用名称
   - **应用描述**：简要描述您的应用
   - **回调地址**：用户授权后的回调URL
   - **应用类型**：选择适合的应用类型

5. 创建成功后，记录以下信息：
   - `Client ID`：您的应用标识
   - `Client Secret`：您的应用密钥（请妥善保管）

## 第二步：集成认证流程

### Web 应用集成

#### 1. 引导用户登录

将用户重定向到授权端点：

```javascript
const authUrl = `https://auth.example.com/oauth/authorize?` +
  `client_id=YOUR_CLIENT_ID&` +
  `response_type=code&` +
  `redirect_uri=YOUR_REDIRECT_URI&` +
  `scope=openid profile email&` +
  `state=RANDOM_STATE_STRING`;

window.location.href = authUrl;
```

#### 2. 处理授权回调

用户授权后，会跳转到您的回调地址，并携带授权码：

```javascript
// 在您的回调页面中获取授权码
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// 验证 state 参数（防止 CSRF 攻击）
if (state !== EXPECTED_STATE) {
  throw new Error('Invalid state parameter');
}
```

#### 3. 交换访问令牌

使用授权码换取访问令牌：

```javascript
const response = await fetch('https://auth.example.com/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET',
    code: code,
    redirect_uri: 'YOUR_REDIRECT_URI',
  }),
});

const tokenData = await response.json();
const accessToken = tokenData.access_token;
```

#### 4. 获取用户信息

使用访问令牌获取用户信息：

```javascript
const userResponse = await fetch('https://auth.example.com/api/user', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const userInfo = await userResponse.json();
console.log('用户信息:', userInfo);
```

## 第三步：配置环境变量

在您的应用中配置以下环境变量：

```bash
# OAuth 配置
OAUTH_CLIENT_ID=your_client_id_here
OAUTH_CLIENT_SECRET=your_client_secret_here
OAUTH_REDIRECT_URI=https://yourapp.com/auth/callback

# 草梅 Auth 服务地址
AUTH_BASE_URL=https://auth.example.com
```

## 完整示例

这里提供一个完整的 JavaScript 示例：

```html
<!DOCTYPE html>
<html>
<head>
    <title>草梅 Auth 集成示例</title>
</head>
<body>
    <div id="app">
        <div id="login-section">
            <h2>登录</h2>
            <button onclick="login()">使用草梅 Auth 登录</button>
        </div>
        
        <div id="user-section" style="display: none;">
            <h2>用户信息</h2>
            <div id="user-info"></div>
            <button onclick="logout()">退出登录</button>
        </div>
    </div>

    <script>
        const CONFIG = {
            clientId: 'YOUR_CLIENT_ID',
            clientSecret: 'YOUR_CLIENT_SECRET',
            redirectUri: window.location.origin + '/callback',
            authBaseUrl: 'https://auth.example.com'
        };

        // 登录函数
        function login() {
            const state = Math.random().toString(36).substring(2);
            localStorage.setItem('oauth_state', state);
            
            const authUrl = `${CONFIG.authBaseUrl}/oauth/authorize?` +
                `client_id=${CONFIG.clientId}&` +
                `response_type=code&` +
                `redirect_uri=${encodeURIComponent(CONFIG.redirectUri)}&` +
                `scope=openid profile email&` +
                `state=${state}`;
            
            window.location.href = authUrl;
        }

        // 处理回调
        async function handleCallback() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            
            if (!code) return;
            
            // 验证 state
            const savedState = localStorage.getItem('oauth_state');
            if (state !== savedState) {
                alert('安全验证失败');
                return;
            }
            
            try {
                // 交换令牌
                const tokenResponse = await fetch(`${CONFIG.authBaseUrl}/oauth/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        client_id: CONFIG.clientId,
                        client_secret: CONFIG.clientSecret,
                        code: code,
                        redirect_uri: CONFIG.redirectUri,
                    }),
                });
                
                const tokenData = await tokenResponse.json();
                const accessToken = tokenData.access_token;
                
                // 保存令牌
                localStorage.setItem('access_token', accessToken);
                
                // 获取用户信息
                await loadUserInfo();
                
                // 清理 URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
            } catch (error) {
                console.error('登录失败:', error);
                alert('登录失败，请重试');
            }
        }

        // 加载用户信息
        async function loadUserInfo() {
            const accessToken = localStorage.getItem('access_token');
            if (!accessToken) return;
            
            try {
                const userResponse = await fetch(`${CONFIG.authBaseUrl}/api/user`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
                
                if (!userResponse.ok) {
                    throw new Error('获取用户信息失败');
                }
                
                const userInfo = await userResponse.json();
                displayUserInfo(userInfo);
                
            } catch (error) {
                console.error('获取用户信息失败:', error);
                logout();
            }
        }

        // 显示用户信息
        function displayUserInfo(userInfo) {
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('user-section').style.display = 'block';
            document.getElementById('user-info').innerHTML = `
                <p><strong>用户名:</strong> ${userInfo.name || userInfo.username}</p>
                <p><strong>邮箱:</strong> ${userInfo.email}</p>
                <p><strong>头像:</strong> <img src="${userInfo.avatar}" alt="头像" style="width: 50px; height: 50px; border-radius: 50%;"></p>
            `;
        }

        // 退出登录
        function logout() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('oauth_state');
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('user-section').style.display = 'none';
        }

        // 页面加载时检查登录状态
        window.addEventListener('load', async () => {
            // 处理OAuth回调
            await handleCallback();
            
            // 检查是否已登录
            const accessToken = localStorage.getItem('access_token');
            if (accessToken) {
                await loadUserInfo();
            }
        });
    </script>
</body>
</html>
```

## 下一步

恭喜！您已经完成了基本集成。接下来可以：

1. [配置更多登录方式](/docs/guides/social-login) - 添加社交媒体登录
2. [实现多因子认证](/docs/guides/mfa) - 增强安全性
3. [查看 API 文档](/docs/api) - 了解更多 API 功能
4. [最佳实践](/docs/guides/best-practices) - 安全和性能优化

## 遇到问题？

如果您在集成过程中遇到问题：

- 查看 [常见问题](/docs/guides/faq)
- 查看 [故障排除指南](/docs/guides/troubleshooting)
- 联系技术支持
