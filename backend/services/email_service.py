"""
Email service using aiosmtplib for async SMTP operations.
Handles: email verification, password reset, appointment confirmations.
"""
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import aiosmtplib

from config.settings import settings

logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
) -> bool:
    """
    Send an email via SMTP.

    Args:
        to_email: Recipient email address.
        subject: Email subject line.
        html_content: HTML body content.
        text_content: Plain text fallback.

    Returns:
        True if sent successfully, False otherwise.
    """
    message = MIMEMultipart("alternative")
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message["Subject"] = subject

    if text_content:
        message.attach(MIMEText(text_content, "plain"))
    message.attach(MIMEText(html_content, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def send_verification_email(to_email: str, name: str, token: str) -> bool:
    """Send account email verification link."""
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Inter, Arial, sans-serif; background: #f8fafc; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; 
                  padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #0891B2; font-size: 28px; margin: 0;">🦷 Dental AI</h1>
          <p style="color: #64748b; margin-top: 8px;">AI-Powered Dental Disease Detection</p>
        </div>
        <h2 style="color: #1e293b;">Verify Your Email Address</h2>
        <p style="color: #475569;">Hello <strong>{name}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">
          Thank you for registering with Dental AI. Please verify your email address 
          by clicking the button below.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{verify_url}"
             style="background: linear-gradient(135deg, #0891B2, #0E7490); color: white;
                    padding: 14px 32px; border-radius: 8px; text-decoration: none;
                    font-weight: 600; font-size: 16px; display: inline-block;">
            ✓ Verify Email Address
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          © 2025 Dental AI — AI-Based Dental Disease Detection System
        </p>
      </div>
    </body>
    </html>
    """
    return await send_email(to_email, "Verify Your Dental AI Account", html)


async def send_password_reset_email(to_email: str, name: str, token: str) -> bool:
    """Send password reset link."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Inter, Arial, sans-serif; background: #f8fafc; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; 
                  padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #0891B2; font-size: 28px; margin: 0;">🦷 Dental AI</h1>
        </div>
        <h2 style="color: #1e293b;">Reset Your Password</h2>
        <p style="color: #475569;">Hello <strong>{name}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">
          We received a request to reset your password. Click the button below to 
          create a new password.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{reset_url}"
             style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white;
                    padding: 14px 32px; border-radius: 8px; text-decoration: none;
                    font-weight: 600; font-size: 16px; display: inline-block;">
            🔒 Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">
          This link expires in 1 hour. If you didn't request a password reset, 
          please secure your account immediately.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          © 2025 Dental AI — AI-Based Dental Disease Detection System
        </p>
      </div>
    </body>
    </html>
    """
    return await send_email(to_email, "Reset Your Dental AI Password", html)


async def send_appointment_confirmation(
    to_email: str, patient_name: str, doctor_name: str,
    appointment_date: str, appointment_time: str
) -> bool:
    """Send appointment booking confirmation."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Inter, Arial, sans-serif; background: #f8fafc; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; 
                  padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #0891B2; font-size: 28px; margin: 0;">🦷 Dental AI</h1>
        </div>
        <h2 style="color: #1e293b;">Appointment Confirmed ✓</h2>
        <p style="color: #475569;">Hello <strong>{patient_name}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">
          Your appointment has been successfully booked. Here are the details:
        </p>
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; 
                    padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Doctor:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">{doctor_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Date:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">{appointment_date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Time:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">{appointment_time}</td>
            </tr>
          </table>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">
          Please arrive 10 minutes before your scheduled time. You can view or cancel your 
          appointment from your patient dashboard.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          © 2025 Dental AI — AI-Based Dental Disease Detection System
        </p>
      </div>
    </body>
    </html>
    """
    return await send_email(to_email, "Appointment Confirmed — Dental AI", html)
