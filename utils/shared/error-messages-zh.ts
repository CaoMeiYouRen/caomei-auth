/**
 * 服务端错误消息的 zh-CN 兜底文案。
 *
 * 与 i18n/locales/zh-CN/errors.json 保持同构，由单测强制校验；
 * 不直接 import JSON：@nuxtjs/i18n 会把 locale JSON 编译成消息 AST。
 */
export const defaultErrorMessages: Record<string, string> = {
    'auth.loginRequired': '请先登录',
    'auth.unauthorized': '未登录用户',
    'auth.forbidden': '无权限访问',
    'auth.demoAdminRequired': 'Demo 模式：无管理员权限',
    'auth.rateLimited': '请求过于频繁，请稍后再试',
    'auth.oauthRegisterAdminOnly': '仅管理员可以访问注册应用接口',
    'auth.oauthManageAdminOnly': '仅管理员可以管理 OAuth 应用',
    'auth.ssoManageAdminOnly': '仅管理员可以访问 SSO 提供商管理接口',
    'oauth.consentsFetchFailed': '获取授权应用列表失败',
    'oauth.revokeSucceeded': '成功撤销授权',
    'oauth.consentNotFound': '未找到对该应用的授权记录',
    'oauth.revokeFailed': '撤销授权失败',
    'oauth.validationFailed': '参数验证失败',
    'oauth.clientNotFound': '应用不存在或已被禁用',
    'oauth.clientFetchFailed': '获取应用信息失败',
    'sso.methodNotAllowed': '方法不允许',
    'server.internal': '服务器内部错误',
}
