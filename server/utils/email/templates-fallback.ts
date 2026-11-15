import { AUTH_BASE_URL, CONTACT_EMAIL } from '@/utils/shared/env'

export function getFallbackFragment(fragmentName: string): string {
    const fallbackFragments: Record<string, string> = {
        'verification-code': `
                <mj-section padding="30px 0">
                    <mj-column>
                        <mj-text align="center" font-size="18px" color="#2d3748" font-weight="600" padding="0 0 20px 0">
                            {{codeTitle}}
                        </mj-text>
                        <mj-text align="center" padding="20px 0"
                                 font-size="36px"
                                 font-weight="bold"
                                 color="#e63946"
                                 background-color="#ffffff"
                                 border-radius="12px"
                                 letter-spacing="4px"
                                 font-family="Monaco, Consolas, 'Lucida Console', monospace">
                            {{verificationCode}}
                        </mj-text>
                        <mj-text align="center" font-size="14px" color="#718096" padding="15px 0 0 0">
                            {{codeExpiresIn}}
                        </mj-text>
                    </mj-column>
                </mj-section>
            `,
        'security-tip': `
                <mj-section padding="20px 0">
                    <mj-column>
                        <mj-text font-size="16px" color="#234e52" font-weight="600" padding="0 0 10px 0">
                            {{securityTipTitle}}
                        </mj-text>
                        <mj-text font-size="14px" color="#234e52" padding="0 0 20px 20px"
                                 background-color="#e6fffa"
                                 border-left="4px solid #38b2ac"
                                 border-radius="6px">
                            {{securityTip}}
                        </mj-text>
                    </mj-column>
                </mj-section>
            `,
        'action-message': `
                <mj-section padding="20px 0">
                    <mj-column>
                        <mj-text font-size="16px" color="#4a5568" padding="0 0 30px 0">
                            {{message}}
                        </mj-text>
                        <mj-button background-color="#e63946"
                                   color="#ffffff"
                                   font-size="16px"
                                   font-weight="600"
                                   padding="15px 0"
                                   border-radius="8px"
                                   href="{{actionUrl}}">
                            {{buttonText}}
                        </mj-button>
                    </mj-column>
                </mj-section>
            `,
        'important-reminder': `
                <mj-section padding="20px 0">
                    <mj-column>
                        <mj-text font-size="14px" color="#4a5568" padding="0 0 10px 0">
                            <strong>{{cannotClick}}</strong>{{copyLinkHint}}
                        </mj-text>
                        <mj-text font-size="12px"
                                 color="#718096"
                                 font-family="monospace"
                                 padding="10px"
                                 background-color="#f7fafc"
                                 border-radius="4px">
                            {{actionUrl}}
                        </mj-text>
                        <mj-text font-size="16px" color="#4a5568" padding="20px 0 0 0">
                            <strong>{{importantReminder}}</strong><br/>
                            {{reminderContent}}
                        </mj-text>
                    </mj-column>
                </mj-section>
            `,
        'simple-message': `
                <mj-section padding="20px 0">
                    <mj-column>
                        <mj-text font-size="16px" color="#4a5568" padding="0 0 20px 0">
                            {{message}}
                        </mj-text>
                        <mj-text font-size="14px" color="#718096" padding="0 0 20px 0">
                            {{extraInfo}}
                        </mj-text>
                    </mj-column>
                </mj-section>
            `,
    }

    return fallbackFragments[fragmentName] || `
            <mj-section padding="20px 0">
                <mj-column>
                    <mj-text font-size="16px" color="#4a5568">
                        {{message}}
                    </mj-text>
                </mj-column>
            </mj-section>
        `
}

export function getBaseTemplateFallback(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" />
    </mj-attributes>
    <mj-style inline="inline">
      .primary-color { color: #e63946 !important; }
      .primary-bg { background-color: #e63946 !important; }
      .code-highlight {
        background: linear-gradient(135deg, #e63946 0%, #ff6b6b 100%) !important;
        color: #ffffff !important;
        font-weight: bold !important;
        padding: 20px 40px !important;
        border-radius: 12px !important;
        letter-spacing: 4px !important;
        font-family: Monaco, Consolas, 'Lucida Console', monospace !important;
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <!-- Header -->
        <mj-section background-color="#e63946" padding="40px 20px">
          <mj-column>
            <mj-text align="center" color="#ffffff" font-size="32px" font-weight="bold">
              {{appName}}
            </mj-text>
            <mj-text align="center" color="rgba(255,255,255,0.9)" font-size="16px" font-weight="400" padding="8px 0 0 0">
              {{headerSubtitle}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Content -->
        <mj-section padding="40px 30px">
          <mj-column>
            <mj-text font-size="20px" color="#2d3748" font-weight="600" padding="0 0 20px 0">
              {{greeting}}
            </mj-text>

            <!-- Main Content Area -->
            {{mainContent}}

          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section background-color="#f7fafc" padding="30px" border-top="1px solid #e2e8f0">
          <mj-column>
            <mj-text align="center" font-size="14px" color="#718096" padding="0 0 15px 0">
              {{helpText}}
            </mj-text>
            <mj-text align="center" font-size="14px" padding="0 0 20px 0">
              <a href="{{contactEmail}}" style="color: #e63946; text-decoration: none; margin: 0 12px;">{{contactLabel}}</a>
              <a href="{{baseUrl}}/privacy" style="color: #e63946; text-decoration: none; margin: 0 12px;">{{privacyLabel}}</a>
              <a href="{{baseUrl}}/terms" style="color: #e63946; text-decoration: none; margin: 0 12px;">{{termsLabel}}</a>
            </mj-text>
            <mj-text align="center" font-size="12px" color="#a0aec0" padding="0">
              © {{currentYear}} {{appName}}. {{allRightsReserved}}
            </mj-text>
            <mj-text align="center" font-size="11px" color="#cbd5e0" padding="10px 0 0 0">
              {{footerNote}}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

export function getEmailVerificationFallback(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
    <mj-style inline="inline">
      .primary-color { color: #e63946 !important; }
      .primary-bg { background-color: #e63946 !important; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <!-- Header -->
        <mj-section background-color="#e63946" padding="40px 20px">
          <mj-column>
            <mj-text align="center" color="#ffffff" font-size="28px" font-weight="bold">
              {{appName}}
            </mj-text>
            <mj-text align="center" color="#ffffff" font-size="16px" font-weight="400" padding-top="8px">
              {{headerSubtitle}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Content -->
        <mj-section padding="40px 30px">
          <mj-column>
            <mj-text font-size="18px" color="#2d3748" padding-bottom="20px">
              {{greeting}}
            </mj-text>
            <mj-text font-size="16px" color="#4a5568" padding-bottom="30px">
              {{message}}
            </mj-text>

            <!-- CTA Button -->
            <mj-button background-color="#e63946" color="#ffffff" font-size="16px" font-weight="600" padding="20px 0" border-radius="8px" href="{{actionUrl}}">
              {{buttonText}}
            </mj-button>

            <!-- Alternative Link -->
            <mj-text font-size="14px" color="#4a5568" padding="30px 0 10px 0">
              <strong>{{cannotClick}}</strong>{{copyLinkHint}}
            </mj-text>
            <mj-text font-size="12px" color="#718096" font-family="monospace" padding="0 0 20px 0" background-color="#f7fafc">
              {{actionUrl}}
            </mj-text>

            <mj-text font-size="16px" color="#4a5568" padding-top="30px">
              <strong>{{importantReminder}}</strong><br/>
              {{reminderContent}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section background-color="#f7fafc" padding="30px" border-top="1px solid #e2e8f0">
          <mj-column>
            <mj-text align="center" font-size="14px" color="#718096" padding-bottom="10px">
              {{helpText}}
            </mj-text>
            <mj-text align="center" font-size="14px" padding-bottom="20px">
              <a href="{{contactEmail}}" style="color: #e63946; text-decoration: none; margin: 0 10px;">{{contactLabel}}</a>
              <a href="{{baseUrl}}/privacy" style="color: #e63946; text-decoration: none; margin: 0 10px;">{{privacyLabel}}</a>
              <a href="{{baseUrl}}/terms" style="color: #e63946; text-decoration: none; margin: 0 10px;">{{termsLabel}}</a>
            </mj-text>
            <mj-text align="center" font-size="12px" color="#a0aec0">
              © {{currentYear}} {{appName}}. {{allRightsReserved}}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

export function getCodeEmailFallback(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
    <mj-style inline="inline">
      .primary-color { color: #e63946 !important; }
      .code-highlight {
        background: linear-gradient(135deg, #e63946 0%, #ff6b6b 100%) !important;
        color: #ffffff !important;
        font-weight: bold !important;
        padding: 20px 40px !important;
        border-radius: 12px !important;
        letter-spacing: 4px !important;
        font-family: Monaco, Consolas, 'Lucida Console', monospace !important;
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <!-- Header -->
        <mj-section background-color="#e63946" padding="40px 20px">
          <mj-column>
            <mj-text align="center" color="#ffffff" font-size="32px" font-weight="bold">
              {{appName}}
            </mj-text>
            <mj-text align="center" color="rgba(255,255,255,0.9)" font-size="16px" font-weight="400" padding="8px 0 0 0">
              {{headerSubtitle}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Content -->
        <mj-section padding="40px 30px">
          <mj-column>
            <mj-text font-size="20px" color="#2d3748" font-weight="600" padding="0 0 20px 0">
              {{greeting}}
            </mj-text>
            <mj-text font-size="16px" color="#4a5568" padding="0 0 20px 0">
              {{message}}
            </mj-text>

            <!-- Verification Code -->
            <mj-text align="center" padding="20px 0" css-class="code-highlight">
              {{verificationCode}}
            </mj-text>

            <!-- Expiry Info -->
            <mj-text font-size="14px" color="#718096" align="center" padding="0 0 30px 0">
              {{codeExpiresIn}}
            </mj-text>

            <!-- Security Tips -->
            <mj-text font-size="14px" color="#234e52" font-weight="600" padding="0 0 8px 0">
              {{securityTipTitle}}
            </mj-text>
            <mj-text font-size="14px" color="#234e52" padding="0 0 20px 0">
              {{securityTip}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section background-color="#f7fafc" padding="30px" border-top="1px solid #e2e8f0">
          <mj-column>
            <mj-text align="center" font-size="14px" color="#718096" padding="0 0 15px 0">
              {{helpText}}
            </mj-text>
            <mj-text align="center" font-size="14px" padding="0 0 20px 0">
              <a href="{{contactEmail}}" style="color: #e63946; text-decoration: none; margin: 0 12px;">{{contactLabel}}</a>
              <a href="{{baseUrl}}/privacy" style="color: #e63946; text-decoration: none; margin: 0 12px;">{{privacyLabel}}</a>
              <a href="{{baseUrl}}/terms" style="color: #e63946; text-decoration: none; margin: 0 12px;">{{termsLabel}}</a>
            </mj-text>
            <mj-text align="center" font-size="12px" color="#a0aec0" padding="0">
              © {{currentYear}} {{appName}}. {{allRightsReserved}}
            </mj-text>
            <mj-text align="center" font-size="11px" color="#cbd5e0" padding="10px 0 0 0">
              {{footerNote}}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

export function getDefaultFallback(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="40px">
      <mj-column>
        <mj-text align="center" font-size="24px" font-weight="bold" color="#e63946" padding-bottom="20px">
          {{appName}}
        </mj-text>
        <mj-text font-size="16px" color="#333333" padding="0 0 20px 0">
          {{message}}
        </mj-text>
        <mj-text align="center" font-size="12px" color="#666666" padding-top="40px">
          © {{currentYear}} {{appName}}. {{allRightsReserved}}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

export function getFallbackMjmlTemplate(templateName: string): string {
    const fallbackTemplates: Record<string, string> = {
        'base-template': getBaseTemplateFallback(),
        'email-verification': getEmailVerificationFallback(),
        'action-email': getEmailVerificationFallback(),
        'code-email': getCodeEmailFallback(),
        default: getDefaultFallback(),
    }

    return fallbackTemplates[templateName] || fallbackTemplates.default || ''
}

export function generateFallbackHtml(title: string, safeData: any): string {
    const primaryColor = '#e63946'
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title || safeData.appName || ''}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, ${primaryColor} 0%, #ff6b6b 100%);
            text-align: center;
            padding: 40px 20px;
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2d3748;
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #4a5568;
        }
        .code-section {
            text-align: center;
            margin: 30px 0;
        }
        .code-box {
            background: linear-gradient(135deg, ${primaryColor} 0%, #ff6b6b 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            padding: 25px 40px;
            display: inline-block;
            border-radius: 12px;
            letter-spacing: 4px;
            font-family: 'Courier New', Monaco, Consolas, monospace;
            box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
            margin: 10px 0;
        }
        .code-note {
            font-size: 14px;
            color: #718096;
            margin-top: 15px;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, ${primaryColor} 0%, #ff6b6b 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-1px);
        }
        .security-tip {
            background: linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%);
            padding: 20px;
            border-left: 4px solid #38b2ac;
            border-radius: 8px;
            margin: 30px 0;
        }
        .security-tip-title {
            font-weight: 600;
            color: #234e52;
            margin-bottom: 8px;
            font-size: 16px;
        }
        .security-tip-content {
            color: #234e52;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-line;
        }
        .footer {
            background: #f7fafc;
            padding: 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        .footer-links {
            margin-bottom: 20px;
        }
        .footer-links a {
            color: ${primaryColor};
            text-decoration: none;
            margin: 0 12px;
            font-size: 14px;
        }
        .footer-copyright {
            font-size: 12px;
            color: #a0aec0;
            margin-bottom: 10px;
        }
        .footer-note {
            font-size: 11px;
            color: #cbd5e0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${safeData.appName}</div>
            <div class="subtitle">${safeData.headerSubtitle ?? ''}</div>
        </div>
        <div class="content">
            <div class="greeting">${safeData.greeting ?? ''}</div>
            <div class="message">${safeData.message}</div>

            ${safeData.verificationCode
                    ? `
            <div class="code-section">
                <div class="code-box">${safeData.verificationCode}</div>
                ${safeData.codeExpiresIn ? `<div class="code-note">${safeData.codeExpiresIn}</div>` : ''}
            </div>
            `
                    : ''
            }

            ${safeData.actionUrl
                    ? `
            <div style="text-align: center;">
                <a href="${safeData.actionUrl}" class="button">${safeData.buttonText}</a>
            </div>
            <div style="margin-top: 20px; font-size: 14px; color: #4a5568;">
                <strong>${safeData.cannotClick ?? ''}</strong>${safeData.copyLinkHint ?? ''}<br/>
                <div style="background: #f7fafc; padding: 10px; border-radius: 4px; margin-top: 8px; font-family: monospace; font-size: 12px; color: #718096; word-break: break-all;">
                    ${safeData.actionUrl}
                </div>
            </div>
            `
                    : ''
            }

            ${safeData.securityTip
                    ? `
            <div class="security-tip">
                <div class="security-tip-title">${safeData.securityTipTitle ?? ''}</div>
                <div class="security-tip-content">${safeData.securityTip}</div>
            </div>
            `
                    : ''
            }
        </div>
        <div class="footer">
            <div class="footer-links">
                <a href="mailto:${CONTACT_EMAIL}">${safeData.contactLabel ?? ''}</a>
                <a href="${AUTH_BASE_URL}/privacy">${safeData.privacyLabel ?? ''}</a>
                <a href="${AUTH_BASE_URL}/terms">${safeData.termsLabel ?? ''}</a>
            </div>
            <div class="footer-copyright">© ${safeData.currentYear} ${safeData.appName}. ${safeData.allRightsReserved ?? ''}</div>
            <div class="footer-note">${safeData.footerNote}</div>
        </div>
    </div>
</body>
</html>`
}
