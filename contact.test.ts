import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { notifyOwner } from "./_core/notification";

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(),
}));

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("contact.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notifyOwner).mockResolvedValue(true);
  });

  it("notifies the owner with the lead details and returns success", async () => {
    const caller = appRouter.createCaller(createContext());

    const result = await caller.contact.submit({
      name: "Empresa Exemplo",
      phone: "(41) 99999-9999",
      email: "contato@exemplo.com.br",
      city: "Curitiba",
      subject: "Solicitação de orçamento",
      message: "Preciso de uma porta automática para uma loja.",
      quote: true,
      website: "",
    });

    expect(result).toEqual({ success: true });
    expect(notifyOwner).toHaveBeenCalledOnce();
    const [payload] = vi.mocked(notifyOwner).mock.calls[0] ?? [];
    expect(payload.title).toContain("Novo contato pelo site");
    expect(payload.title).toContain("Solicitação de orçamento");
    expect(payload.content).toContain("Empresa Exemplo");
    expect(payload.content).toContain("contato@exemplo.com.br");
    expect(payload.content).toContain("Responder para");
  });

  it("silently accepts the honeypot path without notifying the owner", async () => {
    const caller = appRouter.createCaller(createContext());

    const result = await caller.contact.submit({
      name: "Bot Example",
      phone: "(41) 99999-9999",
      email: "bot@example.com",
      city: "Curitiba",
      subject: "Contato",
      message: "Automated submission",
      quote: false,
      website: "https://spam.example",
    });

    expect(result).toEqual({ success: true });
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("returns a service error when notification delivery is unavailable", async () => {
    vi.mocked(notifyOwner).mockResolvedValue(false);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.contact.submit({
      name: "Empresa Exemplo",
      phone: "(41) 99999-9999",
      email: "contato@exemplo.com.br",
      city: "Pinhais",
      subject: "Portão automático",
      message: "Gostaria de receber uma visita técnica.",
      quote: false,
      website: "",
    })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
});
