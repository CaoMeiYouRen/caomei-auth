# 百度统计集成使用说明

本项目已集成百度统计（百度站长统计）工具，提供网站流量分析、用户行为分析和数据统计功能。

## 配置

### 1. 环境变量配置

在 `.env` 文件中添加您的百度统计 ID：

```bash
# 百度统计 ID
NUXT_PUBLIC_BAIDU_ANALYTICS_ID=your_baidu_analytics_id
```

### 2. 获取百度统计 ID

1. 访问 [百度统计](https://tongji.baidu.com/)
2. 使用百度账号登录
3. 添加网站或选择现有网站
4. 进入管理页面，获取统计代码
5. 在代码中找到形如 `hm.js?xxxxxxxxxx` 的统计 ID（问号后面的部分）

## 功能特性

### 自动页面跟踪

百度统计会自动跟踪以下数据：

-   **页面访问量（PV）**：每个页面的访问次数
-   **独立访客数（UV）**：网站的独立访客数量
-   **会话数**：用户会话统计
-   **页面停留时间**：用户在每个页面的停留时长
-   **跳出率**：单页面会话的比例

### 用户行为分析

-   **访问来源分析**：统计用户访问来源（搜索引擎、外部链接等）
-   **搜索词分析**：用户通过搜索引擎访问的关键词
-   **地域分布**：访客的地理位置分布
-   **浏览器和系统分析**：访客使用的浏览器和操作系统统计

### 实时统计

-   **实时访客**：当前在线访客数量
-   **实时页面**：当前正在访问的页面
-   **实时来源**：访客的实时来源统计

## 使用方法

### 基本集成

百度统计已自动集成到项目中，当设置了 `NUXT_PUBLIC_BAIDU_ANALYTICS_ID` 环境变量后，统计代码会自动加载。

### 手动事件跟踪

如果需要手动跟踪特定事件，可以使用以下方法：

```javascript
// 检查百度统计是否已加载
if (typeof _hmt !== "undefined") {
    // 跟踪页面访问
    _hmt.push(["_trackPageview", "/custom-page"]);

    // 跟踪自定义事件
    _hmt.push(["_trackEvent", "category", "action", "label", value]);
}
```

### 在 Vue 组件中使用

```vue
<template>
    <div>
        <button @click="trackButtonClick">跟踪按钮点击</button>
        <a href="/download" @click="trackDownload">下载文件</a>
    </div>
</template>

<script setup lang="ts">
// 使用百度统计 composable
const baidu = useBaiduAnalytics();

// 跟踪按钮点击事件
const trackButtonClick = () => {
    baidu.trackEvent("button", "click", "主要按钮", 1);
};

// 跟踪下载事件
const trackDownload = () => {
    baidu.trackEvent("download", "file", "用户手册", 1);
};

// 页面加载时跟踪页面访问
onMounted(() => {
    baidu.trackPageview();
});

// 跟踪页面停留时间
const pageStartTime = Date.now();
onUnmounted(() => {
    const stayTime = Date.now() - pageStartTime;
    baidu.trackEvent(
        "engagement",
        "time_on_page",
        route.path,
        Math.floor(stayTime / 1000)
    );
});
</script>
```

### 跟踪用户登录状态

```javascript
// 在用户登录后设置自定义变量
const trackUserLogin = (userId, userType) => {
    if (typeof _hmt !== "undefined") {
        // 设置自定义变量
        _hmt.push(["_setCustomVar", 1, "user_type", userType, 1]);
        _hmt.push(["_setCustomVar", 2, "user_id", userId, 1]);

        // 跟踪登录事件
        _hmt.push(["_trackEvent", "user", "login", userType, 1]);
    }
};

// 跟踪用户注册
const trackUserRegister = (registrationMethod) => {
    if (typeof _hmt !== "undefined") {
        _hmt.push(["_trackEvent", "user", "register", registrationMethod, 1]);
    }
};
```

## 最佳实践

### 1. 事件命名规范

建议使用清晰的事件命名规范：

```javascript
// 推荐的事件结构
_hmt.push([
    "_trackEvent",
    "category", // 事件类别（如：user, navigation, form）
    "action", // 事件动作（如：click, submit, view）
    "label", // 事件标签（如：login_button, contact_form）
    value, // 事件值（数字，可选）
]);
```

### 2. 常用事件类别

-   **user**: 用户相关事件（登录、注册、退出）
-   **navigation**: 导航相关事件（菜单点击、页面跳转）
-   **form**: 表单相关事件（提交、验证、错误）
-   **content**: 内容相关事件（查看、下载、分享）
-   **engagement**: 用户参与度事件（停留时间、滚动深度）

### 3. 隐私保护

请注意保护用户隐私：

```javascript
// 避免发送敏感信息
const trackSafeEvent = (category, action) => {
    if (typeof _hmt !== "undefined") {
        // 不要发送个人身份信息
        _hmt.push(["_trackEvent", category, action, "anonymous_label"]);
    }
};
```

## 数据查看

### 1. 基础报告

在百度统计管理后台可以查看：

-   **概况**：网站整体数据概览
-   **趋势分析**：时间序列数据分析
-   **来源分析**：访客来源详细分析
-   **页面分析**：各页面访问情况

### 2. 高级分析

-   **转化分析**：设置转化目标，分析转化率
-   **路径分析**：用户在网站中的访问路径
-   **热力图**：页面点击热力图（需要额外开通）
-   **A/B 测试**：页面版本对比测试

## 故障排除

### 1. 统计代码未加载

检查以下几点：

1. 确认 `NUXT_PUBLIC_BAIDU_ANALYTICS_ID` 环境变量已正确设置
2. 检查统计 ID 格式是否正确（应为纯数字或字母数字组合）
3. 确认网站域名已在百度统计后台正确配置

### 2. 数据不显示

可能的原因：

1. **延迟**: 百度统计数据通常有 2-4 小时的延迟
2. **过滤器**: 检查是否设置了 IP 过滤或其他过滤条件
3. **代码问题**: 使用浏览器开发者工具检查是否有 JavaScript 错误

### 3. 调试统计代码

在浏览器控制台中检查：

```javascript
// 检查百度统计是否已加载
console.log(typeof _hmt !== "undefined" ? "百度统计已加载" : "百度统计未加载");

// 查看当前页面的统计 ID
console.log(
    "统计 ID:",
    document.querySelector('script[src*="hm.baidu.com"]')?.src
);
```

## 注意事项

### 1. 合规性

-   确保符合当地的数据保护法规
-   在隐私政策中说明使用百度统计
-   根据需要实现用户同意机制

### 2. 性能影响

-   百度统计脚本会异步加载，不会阻塞页面渲染
-   避免在短时间内发送大量自定义事件

### 3. 数据准确性

-   使用广告拦截器的用户可能不会被统计
-   某些隐私浏览模式可能影响统计准确性

## 相关链接

-   [百度统计官网](https://tongji.baidu.com/)
-   [百度统计帮助中心](https://tongji.baidu.com/web/help/article?id=174)
-   [百度统计 API 文档](https://tongji.baidu.com/api/manual/)
