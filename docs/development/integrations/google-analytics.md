# Google Analytics 集成使用说明

本项目已集成 Google Analytics (GA4) 工具，提供网站流量分析、用户行为分析和数据统计功能。

## 配置

### 1. 环境变量配置

在 `.env` 文件中添加您的 Google Analytics 测量 ID：

```bash
# Google Analytics 测量 ID (GA4)
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 2. 获取 Google Analytics 测量 ID

1. 访问 [Google Analytics](https://analytics.google.com/)
2. 使用 Google 账号登录
3. 创建新的账号和资源，或选择现有资源
4. 在资源设置中找到"数据流"
5. 创建或选择网站数据流
6. 复制测量 ID（格式为 `G-XXXXXXXXXX`）

### 3. Google 跟踪代码设置

项目会自动加载以下 Google 跟踪代码：

```html
<!-- Google tag (gtag.js) -->
<script
    async
    src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("config", "G-XXXXXXXXXX");
</script>
```

## 功能特性

### 自动页面跟踪

Google Analytics 会自动跟踪以下数据：

-   **页面访问量**：每个页面的访问次数
-   **独立用户数**：网站的独立用户数量
-   **会话数**：用户会话统计
-   **页面停留时间**：用户在每个页面的停留时长
-   **跳出率**：单页面会话的比例

### 用户行为分析

-   **流量来源分析**：统计用户访问来源（搜索引擎、社交媒体、直接访问等）
-   **用户设备分析**：访客使用的设备、浏览器和操作系统统计
-   **地理位置分析**：访客的地理位置分布
-   **用户参与度**：页面互动和转化漏斗分析

### 实时数据

-   **实时用户**：当前在线用户数量
-   **实时页面**：当前正在访问的页面
-   **实时事件**：用户实时交互事件

## 使用方法

### 基本集成

Google Analytics 已自动集成到项目中，当设置了 `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID` 环境变量后，跟踪代码会自动加载。

### 手动事件跟踪

如果需要手动跟踪特定事件，可以使用以下方法：

```javascript
// 检查 Google Analytics 是否已加载
if (typeof gtag !== "undefined") {
    // 跟踪自定义事件
    gtag("event", "button_click", {
        event_category: "engagement",
        event_label: "主要按钮",
        value: 1,
    });

    // 跟踪页面访问
    gtag("config", "G-XXXXXXXXXX", {
        page_title: "自定义页面标题",
        page_location: window.location.href,
        page_path: "/custom-path",
    });
}
```

### 在 Vue 组件中使用

```vue
<template>
    <div>
        <button @click="trackButtonClick">跟踪按钮点击</button>
        <a href="/download" @click="trackDownload">下载文件</a>
        <form @submit="trackFormSubmit">
            <button type="submit">提交表单</button>
        </form>
    </div>
</template>

<script setup lang="ts">
// 使用 Google Analytics composable
const ga = useGoogleAnalytics();

// 跟踪按钮点击事件
const trackButtonClick = () => {
    ga.trackEvent("button_click", {
        event_category: "engagement",
        event_label: "主要按钮",
        button_text: "跟踪按钮点击",
    });
};

// 跟踪下载事件
const trackDownload = () => {
    ga.trackEvent("file_download", {
        event_category: "downloads",
        event_label: "用户手册",
        file_name: "user_manual.pdf",
    });
};

// 跟踪表单提交
const trackFormSubmit = () => {
    ga.trackEvent("form_submit", {
        event_category: "engagement",
        event_label: "联系表单",
        form_name: "contact_form",
    });
};

// 页面加载时跟踪页面访问
onMounted(() => {
    ga.trackPageview({
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
    });
});

// 设置用户属性
const setUserProperties = () => {
    ga.setUserProperties({
        user_type: "registered",
        preferred_language: "zh-CN",
    });
};
</script>
```

### Composable API

项目提供了 `useGoogleAnalytics` composable，包含以下方法：

```typescript
const ga = useGoogleAnalytics();

// 检查是否已加载
if (ga.isLoaded()) {
    // 跟踪页面访问
    ga.trackPageview({
        page_title: "页面标题",
        page_location: "https://example.com/page",
        page_path: "/page",
    });

    // 跟踪事件
    ga.trackEvent("custom_event", {
        event_category: "category",
        event_label: "label",
        value: 123,
    });

    // 设置用户属性
    ga.setUserProperties({
        user_id: "user123",
        user_type: "premium",
    });

    // 设置配置
    ga.setConfig("G-XXXXXXXXXX", {
        anonymize_ip: true,
        allow_ad_personalization_signals: false,
    });
}
```

## 常用事件跟踪示例

### 用户认证事件

```javascript
// 用户登录
ga.trackEvent("login", {
    method: "email",
});

// 用户注册
ga.trackEvent("sign_up", {
    method: "email",
});

// 用户注销
ga.trackEvent("logout");
```

### 电商事件（如适用）

```javascript
// 查看商品
ga.trackEvent("view_item", {
    currency: "CNY",
    value: 99.99,
    items: [
        {
            item_id: "SKU123",
            item_name: "商品名称",
            category: "商品分类",
            quantity: 1,
            price: 99.99,
        },
    ],
});

// 添加到购物车
ga.trackEvent("add_to_cart", {
    currency: "CNY",
    value: 99.99,
    items: [
        /* 商品信息 */
    ],
});

// 购买完成
ga.trackEvent("purchase", {
    transaction_id: "T_12345",
    currency: "CNY",
    value: 199.98,
    items: [
        /* 商品信息 */
    ],
});
```

### 内容交互事件

```javascript
// 搜索
ga.trackEvent("search", {
    search_term: "搜索关键词",
});

// 分享
ga.trackEvent("share", {
    method: "social_media",
    content_type: "article",
    item_id: "article_123",
});

// 视频播放
ga.trackEvent("video_play", {
    video_title: "视频标题",
    video_duration: 120,
});
```

## 隐私和合规

### GDPR 合规

如果您的网站面向欧洲用户，需要考虑 GDPR 合规：

```javascript
// 禁用广告个性化
ga.setConfig("G-XXXXXXXXXX", {
    allow_ad_personalization_signals: false,
});

// IP 匿名化（GA4 默认启用）
ga.setConfig("G-XXXXXXXXXX", {
    anonymize_ip: true,
});
```

### 数据保留设置

在 Google Analytics 控制台中：

1. 转到"数据设置" > "数据保留"
2. 设置用户数据和事件数据保留期限
3. 启用"重置用户数据"选项

## 调试和验证

### 开发环境调试

```javascript
// 启用调试模式
ga.setConfig("G-XXXXXXXXXX", {
    debug_mode: true,
});
```

### 使用 Google Analytics 调试工具

1. 安装 [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome 扩展
2. 在开发者工具中查看网络请求
3. 使用 [GA4 Debug View](https://support.google.com/analytics/answer/7201382) 实时验证数据

## 常见问题

### Q: 为什么看不到实时数据？

A: 确保：

-   测量 ID 配置正确
-   网站可以正常访问
-   没有广告拦截器阻止跟踪代码
-   在 GA4 界面查看"实时"报告

### Q: 如何过滤内部流量？

A: 在 Google Analytics 中：

1. 转到"数据设置" > "数据过滤器"
2. 创建内部流量过滤器
3. 设置开发者 IP 地址范围

### Q: 数据不准确怎么办？

A: 检查：

-   跟踪代码是否重复加载
-   事件参数是否正确设置
-   是否有单页应用路由问题
-   数据采样设置是否合适

## 更多资源

-   [Google Analytics 4 官方文档](https://developers.google.com/analytics/devguides/collection/ga4)
-   [gtag.js 开发者指南](https://developers.google.com/analytics/devguides/collection/gtagjs)
-   [GA4 事件参考](https://developers.google.com/analytics/devguides/collection/ga4/events)
-   [Google Analytics Academy](https://analytics.google.com/analytics/academy/)
