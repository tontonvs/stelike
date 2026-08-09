/**
 * Thin wrapper around Paystack's Inline v2 popup.
 *
 * IMPORTANT: `onSuccess` firing here only means the popup finished — it is NOT
 * proof of payment. Before treating an order as paid, the returned reference
 * must be verified server-side (e.g. a Supabase edge function or any small
 * backend calling Paystack's "Verify Transaction" endpoint with your SECRET
 * key). Never put the secret key in frontend code.
 */

export type PaystackTransactionParams = {
  email: string;
  /** Amount in the smallest currency unit — pesewas for GHS (e.g. GH₵45 → 4500). */
  amount: number;
  currency?: string;
  reference?: string;
  channels?: string[];
  metadata?: Record<string, unknown>;
};

type PaystackTransaction = { reference: string };

type PaystackPopInstance = {
  newTransaction: (
    params: PaystackTransactionParams & {
      key: string;
      onSuccess: (transaction: PaystackTransaction) => void;
      onCancel: () => void;
    },
  ) => void;
};

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
  }
}

const SCRIPT_SRC = "https://js.paystack.co/v2/inline.js";
let scriptPromise: Promise<void> | null = null;

function loadPaystackScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paystack can only be loaded in the browser."));
  }
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Could not load Paystack.")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load Paystack. Check your connection and try again."));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/** Opens the Paystack popup for a one-off payment. */
export async function payWithPaystack(
  params: PaystackTransactionParams,
  handlers: { onSuccess: (reference: string) => void; onCancel: () => void },
): Promise<void> {
  await loadPaystackScript();
  if (!window.PaystackPop) throw new Error("Paystack failed to load.");

  const key = import.meta.env["VITE_PAYSTACK_PUBLIC_KEY"] as string | undefined;
  if (!key) {
    throw new Error(
      "Missing VITE_PAYSTACK_PUBLIC_KEY. Add it to a .env file (see .env.example) before taking real payments.",
    );
  }

  const pop = new window.PaystackPop();
  pop.newTransaction({
    ...params,
    key,
    currency: params.currency ?? "GHS",
    onSuccess: (transaction) => handlers.onSuccess(transaction.reference),
    onCancel: handlers.onCancel,
  });
}
