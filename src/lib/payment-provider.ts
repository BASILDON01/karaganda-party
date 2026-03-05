/**
 * Создание счёта на оплату через агрегатор (Kaspi Pay / Halyk).
 * В тестовом режиме (PAYMENT_MODE !== 'live' или нет ключа) возвращаем null — билеты создаются сразу.
 */
export type CreateInvoiceResult = {
  paymentUrl: string;
  invoiceId: string;
} | null;

export async function createPaymentInvoice(params: {
  orderId: string;
  amount: number;
  description: string;
  returnUrl: string;
  paymentMethod: "kaspi" | "halyk";
  userPhone?: string;
}): Promise<CreateInvoiceResult> {
  const mode = process.env.PAYMENT_MODE;
  const apiKey = process.env.APIPAY_API_KEY ?? process.env.PAYMENT_API_KEY;
  const baseUrl = process.env.APIPAY_BASE_URL ?? "https://api.apipay.kz";

  if (mode !== "live" || !apiKey) {
    return null;
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        amount: Math.round(params.amount),
        external_order_id: params.orderId,
        description: params.description.slice(0, 255),
        return_url: params.returnUrl,
        phone_number: params.userPhone || undefined,
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      console.error("[payment] createInvoice error", res.status, data);
      return null;
    }

    const paymentUrl =
      typeof data.payment_url === "string"
        ? data.payment_url
        : typeof data.url === "string"
          ? data.url
          : typeof data.link === "string"
            ? data.link
            : null;
    const invoiceId =
      typeof data.id === "string" ? data.id : typeof data.id === "number" ? String(data.id) : (data.invoice_id as string) ?? "";

    if (paymentUrl) {
      return { paymentUrl, invoiceId };
    }
    console.error("[payment] no payment_url in response", data);
    return null;
  } catch (e) {
    console.error("[payment] createInvoice exception", e);
    return null;
  }
}
