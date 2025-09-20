import type { Transporter } from "nodemailer";

import { env } from "../config/env";
import { logger } from "../config/logger";

type PasswordResetOptions = {
  to: string;
  token: string;
  expiresAt: string;
  lifetimeMinutes: number;
};

class EmailService {
  private transporterPromise: Promise<Transporter> | null = null;

  private async resolveTransporter(): Promise<Transporter | null> {
    if (!env.SMTP_HOST) {
      logger.warn(
        "SMTP host not configured. Password reset emails will be logged instead of delivered.",
      );
      return null;
    }

    if (!this.transporterPromise) {
      this.transporterPromise = import("nodemailer")
        .then(({ default: nodemailer }) => {
          return nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth:
              env.SMTP_USER && env.SMTP_PASS
                ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
                : undefined,
          });
        })
        .catch((error) => {
          this.transporterPromise = null;
          logger.error(error, "Failed to initialise SMTP transport");
          return null;
        });
    }

    try {
      return await this.transporterPromise;
    } catch (error) {
      logger.error(error, "Failed to resolve SMTP transport");
      this.transporterPromise = null;
      return null;
    }
  }

  private buildFromAddress(): string {
    const baseName = env.MAIL_FROM_NAME ?? "WhyLearn";
    if (env.MAIL_FROM) {
      return `${baseName} <${env.MAIL_FROM}>`;
    }
    let hostname = "whylearn.local";
    try {
      const url = new URL(env.APP_URL);
      hostname = url.hostname;
    } catch (error) {
      logger.warn({ error }, "Failed to parse APP_URL for fallback mail domain");
    }
    return `${baseName} <no-reply@${hostname}>`;
  }

  private buildPasswordResetHtml(
    resetUrl: string,
    lifetimeMinutes: number,
    expiryLabel: string,
  ): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Reset your WhyLearn password</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="background:#0b1220;color:#f1f5f9;font-family:Inter,Segoe UI,system-ui,sans-serif;margin:0;padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#0f172a;border-radius:24px;overflow:hidden;">
      <tr>
        <td style="padding:32px 32px 24px;border-bottom:1px solid rgba(148,163,184,0.16);">
          <span style="display:inline-flex;padding:6px 14px;border-radius:999px;background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">WhyLearn</span>
          <h1 style="margin:24px 0 12px;font-size:26px;line-height:1.24;font-weight:700;color:#f8fafc;">
            Secure your account with a fresh password
          </h1>
          <p style="margin:0;color:#cbd5f5;font-size:15px;line-height:1.6;">
            We received a request to reset your WhyLearn password. Tap the button below to create a new one within the next ${lifetimeMinutes} minutes.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 24px;border-radius:16px;background:linear-gradient(135deg,#38bdf8,#22d3ee);color:#020617;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 18px 38px rgba(34,211,238,0.24);">Reset password</a>
          <p style="margin:18px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">
            This link expires at <span style="color:#f8fafc;font-weight:600;">${expiryLabel}</span>.
          </p>
          <p style="margin:18px 0 0;color:#94a3b8;font-size:14px;line-height:1.6;">
            If the button does not work, copy and paste this link into your browser:
          </p>
          <p style="margin:12px 0 0;word-break:break-all;color:#e2e8f0;font-size:13px;">${resetUrl}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;background:#0b1120;border-top:1px solid rgba(148,163,184,0.16);color:#64748b;font-size:12px;">
          <p style="margin:0 0 12px;">Need support? Reply to this email and our team will help you regain access.</p>
          <p style="margin:0;">If you did not request a reset you can safely ignore this message.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  async sendPasswordResetEmail(options: PasswordResetOptions): Promise<void> {
    const transporter = await this.resolveTransporter();
    const resetUrl = this.buildResetUrl(options.token);
    const expiryLabel = this.formatExpiry(options.expiresAt);

    const subject = "Reset your WhyLearn password";
    const html = this.buildPasswordResetHtml(resetUrl, options.lifetimeMinutes, expiryLabel);
    const text = this.buildPasswordResetText(resetUrl, options.lifetimeMinutes, expiryLabel);

    if (!transporter) {
      logger.info(
        { to: options.to, resetUrl, expiresAt: options.expiresAt },
        "Password reset email logged (SMTP disabled)",
      );
      return;
    }

    try {
      await transporter.sendMail({
        to: options.to,
        from: this.buildFromAddress(),
        subject,
        text,
        html,
      });
      logger.info({ to: options.to, expiresAt: options.expiresAt }, "Password reset email delivered");
    } catch (error) {
      logger.error(error, "Failed to send password reset email");
      throw error;
    }
  }

  private buildResetUrl(token: string): string {
    try {
      const url = new URL('/auth/reset', env.APP_URL);
      url.searchParams.set('token', token);
      return url.toString();
    } catch (error) {
      logger.error({ error, token }, 'Failed to construct password reset URL');
      return `${env.APP_URL.replace(/\/$/, '')}/auth/reset?token=${encodeURIComponent(token)}`;
    }
  }

  private buildPasswordResetText(
    resetUrl: string,
    lifetimeMinutes: number,
    expiryLabel: string,
  ): string {
    return [
      "We received a request to reset your WhyLearn password.",
      `Reset link: ${resetUrl}`,
      "",
      `The link expires in ${lifetimeMinutes} minutes (by ${expiryLabel}). If you didn't request a reset, you can ignore this message.`,
    ].join('\n');
  }

  private formatExpiry(expiresAt: string): string {
    try {
      const date = new Date(expiresAt);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch (error) {
      logger.warn({ error, expiresAt }, 'Unable to format password reset expiry timestamp');
      return expiresAt;
    }
  }
}

export const emailService = new EmailService();
