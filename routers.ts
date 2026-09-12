import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const contactInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(40),
  email: z.string().trim().email().max(320),
  city: z.string().trim().min(2).max(100),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(8).max(4000),
  quote: z.boolean().default(false),
  website: z.string().max(120).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  contact: router({
    submit: publicProcedure.input(contactInput).mutation(async ({ input }) => {
      // Honeypot: bots filling the hidden field receive a neutral success response.
      if (input.website?.trim()) return { success: true } as const;

      const sentAt = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "short",
      });
      const title = `[PORTAS DE AÇO UNIÃO] – Novo contato pelo site – ${input.subject}`;
      const content = [
        `Novo contato recebido pelo site Portas de Aço União.`,
        ``,
        `Nome/empresa: ${input.name}`,
        `Telefone/WhatsApp: ${input.phone}`,
        `E-mail (Responder para): ${input.email}`,
        `Cidade: ${input.city}`,
        `Assunto: ${input.subject}`,
        `Solicita orçamento: ${input.quote ? "Sim" : "Não"}`,
        `Data e horário: ${sentAt} (horário de Brasília)`,
        ``,
        `Mensagem:`,
        input.message,
      ].join("\n");

      const notified = await notifyOwner({ title, content });
      if (!notified) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Não foi possível enviar sua mensagem. Tente novamente ou entre em contato pelo WhatsApp.",
        });
      }

      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
