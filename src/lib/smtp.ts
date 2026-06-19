import nodemailer from "nodemailer";
import { COMPANY } from "@/lib/company";

function env(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() || undefined;
}

export function isSmtpConfigured(): boolean {
  return Boolean(env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS"));
}

export function getOrderInquiryRecipient(): string {
  return env("ORDER_INQUIRY_TO_EMAIL") ?? COMPANY.email;
}

export function getSmtpFromAddress(): string {
  return env("SMTP_FROM") ?? COMPANY.email;
}

export function createSmtpTransport() {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
  }

  const port = Number(env("SMTP_PORT") ?? "587");
  const secure = env("SMTP_SECURE") === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(port === 587 && !secure ? { requireTLS: true } : {}),
  });
}
