import sgMail from '@sendgrid/mail'
import type { MailDataRequired } from '@sendgrid/helpers/classes/mail'
import { captureError, addBreadcrumb } from '../config/sentry'

/**
 * Initialize SendGrid API
 */
const initializeSendGrid = (): void => {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    console.warn('⚠️  SENDGRID_API_KEY not configured. Email functionality disabled.')
    return
  }
  sgMail.setApiKey(apiKey)
}

/**
 * Email template types
 */
export enum EmailTemplate {
  VERIFICATION = 'VERIFICATION',
  REPORT_SUBMITTED = 'REPORT_SUBMITTED',
  EVIDENCE_UPLOADED = 'EVIDENCE_UPLOADED',
  MODERATION_ALERT = 'MODERATION_ALERT',
  STATUS_UPDATE = 'STATUS_UPDATE',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

/**
 * Email options interface
 */
export interface EmailOptions {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
  template?: EmailTemplate
  variables?: Record<string, string | number>
  cc?: string[]
  bcc?: string[]
  replyTo?: string
}

/**
 * Send email via SendGrid with error handling
 * Gracefully falls back if SendGrid not configured
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const { to, subject, htmlContent, textContent, cc, bcc, replyTo } = options

  try {
    // Validate email address
    if (!validateEmail(to)) {
      throw new Error(`Invalid email address: ${to}`)
    }

    const senderEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@africajustice.com'

    const msg: MailDataRequired = {
      to,
      from: senderEmail,
      subject,
      html: htmlContent,
      text: textContent || stripHtmlTags(htmlContent),
    }

    // Optional fields
    if (cc && cc.length > 0) msg.cc = cc
    if (bcc && bcc.length > 0) msg.bcc = bcc
    if (replyTo) msg.replyTo = replyTo

    // Send via SendGrid if configured
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg)
      addBreadcrumb(`Email sent to ${to}`, 'email', 'info', { subject })
      return true
    } else {
      // Fallback: log to console in development
      console.log('📧 [DEV MODE] Email not sent (SendGrid not configured):', {
        to,
        subject,
        preview: htmlContent.substring(0, 100),
      })
      addBreadcrumb(`Email logged (dev mode): ${to}`, 'email', 'info', { subject })
      return false
    }
  } catch (error) {
    console.error('Email sending error:', error)
    captureError(error as Error, {
      context: 'emailService',
      extra: { recipient: to, subject },
    })
    return false
  }
}

/**
 * Send templated email
 */
export const sendTemplatedEmail = async (options: EmailOptions): Promise<boolean> => {
  return sendEmail(options)
}

/**
 * Send verification email
 */
export const sendVerificationEmail = async (
  email: string,
  verificationLink: string,
  userName: string
): Promise<boolean> => {
  const htmlContent = `
    <h2>Email Verification</h2>
    <p>Hi ${escapeHtml(userName)},</p>
    <p>Please verify your email address to complete your registration:</p>
    <p><a href="${escapeHtml(verificationLink)}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
    <p>Link expires in 24 hours.</p>
    <p>If you didn't create an account, please ignore this email.</p>
  `

  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    htmlContent,
    template: EmailTemplate.VERIFICATION,
  })
}

/**
 * Send report submission confirmation
 */
export const sendReportSubmissionEmail = async (
  email: string,
  reportId: string,
  reportTitle: string
): Promise<boolean> => {
  const htmlContent = `
    <h2>Report Submitted Successfully</h2>
    <p>Your report has been received and is now under review.</p>
    <p><strong>Report ID:</strong> ${escapeHtml(reportId)}</p>
    <p><strong>Title:</strong> ${escapeHtml(reportTitle)}</p>
    <p>You can track the status of your report in your account dashboard.</p>
    <p>Thank you for helping us build a more transparent justice system.</p>
  `

  return sendEmail({
    to: email,
    subject: 'Report Submission Confirmed',
    htmlContent,
    template: EmailTemplate.REPORT_SUBMITTED,
  })
}

/**
 * Send moderation alert to admin
 */
export const sendModerationAlertEmail = async (
  adminEmail: string,
  itemType: string,
  itemId: string,
  reason: string
): Promise<boolean> => {
  const dashboardLink = `${process.env.FRONTEND_URL || 'https://africajustice.com'}/admin/queue`

  const htmlContent = `
    <h2>Moderation Alert</h2>
    <p>A new item requires moderation review:</p>
    <ul>
      <li><strong>Type:</strong> ${escapeHtml(itemType)}</li>
      <li><strong>ID:</strong> ${escapeHtml(itemId)}</li>
      <li><strong>Reason:</strong> ${escapeHtml(reason)}</li>
    </ul>
    <p><a href="${escapeHtml(dashboardLink)}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review in Dashboard</a></p>
  `

  return sendEmail({
    to: adminEmail,
    subject: `Moderation Alert: ${itemType} requires review`,
    htmlContent,
    template: EmailTemplate.MODERATION_ALERT,
  })
}

/**
 * Send status update email
 */
export const sendStatusUpdateEmail = async (
  email: string,
  itemType: string,
  itemId: string,
  oldStatus: string,
  newStatus: string
): Promise<boolean> => {
  const htmlContent = `
    <h2>Status Update</h2>
    <p>A ${escapeHtml(itemType)} you're following has been updated:</p>
    <ul>
      <li><strong>ID:</strong> ${escapeHtml(itemId)}</li>
      <li><strong>Previous Status:</strong> ${escapeHtml(oldStatus)}</li>
      <li><strong>New Status:</strong> ${escapeHtml(newStatus)}</li>
    </ul>
    <p>Log in to your account for more details.</p>
  `

  return sendEmail({
    to: email,
    subject: `${itemType} Status Update`,
    htmlContent,
    template: EmailTemplate.STATUS_UPDATE,
  })
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string,
  expiresInMinutes: number = 60
): Promise<boolean> => {
  const htmlContent = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset for your account.</p>
    <p><a href="${escapeHtml(resetLink)}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
    <p>This link expires in ${expiresInMinutes} minutes.</p>
    <p>If you didn't request this reset, please ignore this email.</p>
  `

  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    htmlContent,
    template: EmailTemplate.PASSWORD_RESET,
  })
}

/**
 * Validate email address format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

// Initialize SendGrid on module load
initializeSendGrid()
