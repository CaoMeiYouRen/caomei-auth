# 文件上传 API

草梅 Auth 提供了文件上传功能，主要用于用户头像上传。支持多种存储后端，包括本地存储、AWS S3、Vercel Blob 等。

## 基础信息

-   **API 基础地址**: `https://auth.example.com/api`
-   **认证方式**: Bearer Token
-   **支持格式**: JPEG, PNG, GIF, WebP
-   **最大文件大小**: 5MB
-   **数据格式**: multipart/form-data

## 端点概览

| 端点           | 方法 | 描述     | 权限要求   |
| -------------- | ---- | -------- | ---------- |
| `/file/upload` | POST | 上传文件 | 已认证用户 |

## 文件上传

### POST /api/file/upload

上传文件到服务器，主要用于用户头像上传。

#### 请求格式

使用 `multipart/form-data` 格式提交文件：

```http
POST /api/file/upload
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="avatar.jpg"
Content-Type: image/jpeg

[文件二进制数据]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

#### 请求参数

| 参数   | 类型 | 必需 | 描述         |
| ------ | ---- | ---- | ------------ |
| `file` | File | 是   | 要上传的文件 |

#### 文件限制

-   **支持格式**:
    -   `image/jpeg` (.jpg, .jpeg)
    -   `image/png` (.png)
    -   `image/gif` (.gif)
    -   `image/webp` (.webp)
-   **最大文件大小**: 5MB (5,242,880 字节)
-   **文件名**: 支持中文和特殊字符

#### 响应示例

**成功响应 (200 OK)**

```json
{
    "data": {
        "url": "https://your-domain.com/uploads/avatars/1234567890_avatar.jpg",
        "filename": "avatar.jpg",
        "size": 102400,
        "mimetype": "image/jpeg",
        "uploadedAt": "2024-01-01T12:00:00Z"
    }
}
```

**字段说明:**

| 字段         | 类型   | 描述                     |
| ------------ | ------ | ------------------------ |
| `url`        | string | 文件的访问 URL           |
| `filename`   | string | 原始文件名               |
| `size`       | number | 文件大小（字节）         |
| `mimetype`   | string | 文件 MIME 类型           |
| `uploadedAt` | string | 上传时间 (ISO 8601 格式) |

## 错误处理

### 错误响应格式

```json
{
    "error": {
        "code": "FILE_TOO_LARGE",
        "message": "文件大小超过限制",
        "details": {
            "maxSize": 5242880,
            "actualSize": 10485760
        }
    }
}
```

### 常见错误代码

| 错误代码            | HTTP 状态码 | 描述             |
| ------------------- | ----------- | ---------------- |
| `UNAUTHORIZED`      | 401         | 未认证或令牌无效 |
| `NO_FILE_PROVIDED`  | 400         | 未提供文件       |
| `FILE_TOO_LARGE`    | 400         | 文件大小超过限制 |
| `INVALID_FILE_TYPE` | 400         | 不支持的文件类型 |
| `UPLOAD_FAILED`     | 500         | 上传失败         |
| `STORAGE_ERROR`     | 500         | 存储服务错误     |

### 错误处理示例

```javascript
try {
    const response = await fetch("/api/file/upload", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
    }

    const result = await response.json();
    console.log("上传成功:", result.data.url);
} catch (error) {
    console.error("上传失败:", error.message);
}
```

## 存储配置

草梅 Auth 支持多种存储后端，通过环境变量进行配置：

### AWS S3

```env
STORAGE_TYPE=s3
STORAGE_S3_BUCKET=your-bucket-name
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ACCESS_KEY_ID=your-access-key
STORAGE_S3_SECRET_ACCESS_KEY=your-secret-key
STORAGE_S3_URL_PREFIX=https://your-bucket.s3.amazonaws.com
```

### Vercel Blob

```env
STORAGE_TYPE=vercel-blob
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

## 使用示例

### JavaScript/TypeScript

#### 基础上传

```javascript
async function uploadFile(file, accessToken) {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/file/upload", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error("上传失败");
        }

        const result = await response.json();
        return result.data.url;
    } catch (error) {
        console.error("上传错误:", error);
        throw error;
    }
}

// 使用示例
const fileInput = document.getElementById("avatar-input");
const file = fileInput.files[0];
const avatarUrl = await uploadFile(file, accessToken);
```

#### 带进度条的上传

```javascript
async function uploadFileWithProgress(file, accessToken, onProgress) {
    const formData = new FormData();
    formData.append("file", file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                onProgress(Math.round(percentComplete));
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
                const result = JSON.parse(xhr.responseText);
                resolve(result.data.url);
            } else {
                reject(new Error("上传失败"));
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("网络错误"));
        });

        xhr.open("POST", "/api/file/upload");
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        xhr.send(formData);
    });
}

// 使用示例
const file = fileInput.files[0];
const avatarUrl = await uploadFileWithProgress(
    file,
    accessToken,
    (progress) => {
        console.log(`上传进度: ${progress}%`);
    }
);
```

#### 文件预览和验证

```javascript
function validateFile(file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        throw new Error("不支持的文件类型");
    }

    if (file.size > maxSize) {
        throw new Error("文件大小超过5MB限制");
    }

    return true;
}

function previewImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

// 完整的上传流程
async function handleFileUpload(file, accessToken) {
    try {
        // 验证文件
        validateFile(file);

        // 预览图片
        const preview = await previewImage(file);
        showPreview(preview);

        // 上传文件
        const avatarUrl = await uploadFileWithProgress(
            file,
            accessToken,
            (progress) => {
                updateProgressBar(progress);
            }
        );

        // 更新用户头像
        await updateUserAvatar(avatarUrl, accessToken);

        console.log("头像更新成功!");
    } catch (error) {
        console.error("上传失败:", error.message);
        showError(error.message);
    }
}
```

### Vue 3 组合式 API

```vue
<template>
    <div class="upload-container">
        <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileChange"
            hidden
        />

        <div class="avatar-preview" @click="selectFile">
            <img v-if="previewUrl" :src="previewUrl" alt="头像预览" />
            <div v-else class="placeholder">点击上传头像</div>
        </div>

        <div v-if="uploading" class="progress-bar">
            <div class="progress" :style="{ width: progress + '%' }"></div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "@/composables/use-auth";

const { accessToken } = useAuth();
const fileInput = ref();
const previewUrl = ref("");
const uploading = ref(false);
const progress = ref(0);

function selectFile() {
    fileInput.value.click();
}

async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        validateFile(file);
        previewUrl.value = await previewImage(file);
        await uploadFile(file);
    } catch (error) {
        alert(error.message);
    }
}

function validateFile(file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
        throw new Error("不支持的文件类型");
    }

    if (file.size > maxSize) {
        throw new Error("文件大小超过5MB限制");
    }
}

function previewImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    uploading.value = true;
    progress.value = 0;

    try {
        const response = await fetch("/api/file/upload", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken.value}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error("上传失败");
        }

        const result = await response.json();

        // 更新用户头像
        await updateUserAvatar(result.data.url);

        console.log("头像更新成功!");
    } finally {
        uploading.value = false;
        progress.value = 0;
    }
}
</script>
```

### React Hook

```typescript
import { useState, useCallback } from "react";

interface UploadResult {
    url: string;
    filename: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
}

export function useFileUpload() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = useCallback(
        async (file: File, accessToken: string): Promise<UploadResult> => {
            const formData = new FormData();
            formData.append("file", file);

            setUploading(true);
            setProgress(0);

            try {
                const response = await fetch("/api/file/upload", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error.message);
                }

                const result = await response.json();
                return result.data;
            } finally {
                setUploading(false);
                setProgress(0);
            }
        },
        []
    );

    return {
        uploadFile,
        uploading,
        progress,
    };
}
```

## 安全注意事项

1. **文件类型验证**: 服务器会验证文件的真实 MIME 类型，不仅仅依赖文件扩展名
2. **文件大小限制**: 防止过大文件消耗服务器资源
3. **访问控制**: 只有认证用户才能上传文件
4. **文件扫描**: 建议在生产环境中集成病毒扫描功能
5. **CDN 配置**: 建议通过 CDN 分发静态文件，提高访问速度

## 性能优化

1. **图片压缩**: 前端可以在上传前压缩图片
2. **格式转换**: 将大图片转换为 WebP 格式以减小文件大小
3. **缓存设置**: 为上传的文件设置适当的缓存头
4. **异步处理**: 大文件上传可以考虑分片上传

通过文件上传 API，您可以轻松地为用户提供头像上传功能。如需更多帮助，请查看 [最佳实践](../guides/best-practices.md) 或 [故障排除指南](../guides/troubleshooting.md)。
