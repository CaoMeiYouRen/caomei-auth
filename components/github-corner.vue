<template>
    <a
        :href="githubUrl"
        class="github-corner"
        :title="title"
        :aria-label="ariaLabel"
        rel="noopener"
        target="_blank"
    >
        <svg
            width="80"
            height="80"
            viewBox="0 0 250 250"
            aria-hidden="true"
        >
            <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z" />
            <path
                d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
                fill="currentColor"
                style="transform-origin: 130px 106px;"
                class="octo-arm"
            />
            <path
                d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
                fill="currentColor"
                class="octo-body"
            />
        </svg>
    </a>
</template>

<script setup lang="ts">
interface Props {
    githubUrl?: string
    title?: string
    ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
    githubUrl: 'https://github.com/CaoMeiYouRen/caomei-auth',
    title: 'Follow me on GitHub',
    ariaLabel: 'Follow me on GitHub',
})
</script>

<style lang="scss" scoped>
.github-corner {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9999;
    border: 0;
    background: transparent;
    color: #fff;
    text-decoration: none;
    transition: all 0.3s ease;

    svg {
        fill: #24292f; // 使用 GitHub 官方主题色
        color: #fff;
        width: 61px;
        height: 61px;
    }

    &:hover {
        .octo-arm {
            animation: octocat-wave 560ms ease-in-out;
        }

        svg {
            fill: #1f2328; // GitHub 深色
        }
    }

    &:focus {
        outline: 2px solid #24292f;
        outline-offset: 2px;
    }
}

@keyframes octocat-wave {
    0%, 100% {
        transform: rotate(0);
    }

    20%, 60% {
        transform: rotate(-25deg);
    }

    40%, 80% {
        transform: rotate(10deg);
    }
}

// 移动端适配
@media (width <= 768px) {
    .github-corner {
        svg {
            width: 50px;
            height: 50px;
        }
    }
}

// 确保在触摸设备上有足够大的触摸区域
@media (hover: none) and (pointer: coarse) {
    .github-corner {
        &:hover .octo-arm {
            animation: none;
        }

        &:active .octo-arm {
            animation: octocat-wave 560ms ease-in-out;
        }
    }
}

// 高对比度模式支持
@media (prefers-contrast: high) {
    .github-corner {
        svg {
            fill: #24292f; // 保持 GitHub 主题色
            color: #fff;
        }

        &:hover svg {
            fill: #1f2328; // GitHub 深色
        }
    }
}

// 暗色模式支持
@include dark-mode {
    .github-corner {
        svg {
            fill: #f0f6fc; // 暗色模式下使用浅色
            color: #24292f;
        }

        &:hover svg {
            fill: #c9d1d9; // 暗色模式悬停效果
        }

        &:focus {
            outline-color: #f0f6fc;
        }
    }
}

// 减少动画偏好设置
@media (prefers-reduced-motion: reduce) {
    .github-corner {
        &:hover .octo-arm {
            animation: none;
        }
    }
}
</style>
