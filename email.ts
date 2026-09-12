import nodemailer from "nodemailer";
import { TRPCError } from "@trpc/server";

const MAILBOX = "portasuniao2@gmail.com";

function getTransporter() {
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!password) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "O envio de e-mail ainda não está configurado.",
    });
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: MAILBOX,
      pass: password,
    },
  });
}

export async function verifyEmailTransport() {
  const transporter = getTransporter();
  await transporter.verify();
  return true;
}

export async function sendContactEmail({
  subject,
  content,
  replyTo,
}: {
  subject: string;
  content: string;
  replyTo: string;
}) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `Portas de Aço União <${MAILBOX}>`,
    to: MAILBOX,
    replyTo,
    subject,
    text: content,
  });
  return true;
}

export { MAILBOX };
