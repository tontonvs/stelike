import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, MessageCircle, PackageSearch, Store } from "lucide-react";
import { lookupOrdersByPhone, type OrderRow } from "@/lib/orders";
import { lookupOrderUpdatesByPhone, type OrderUpdate } from "@/lib/orderUpdates";
import { isGpsAddress, gpsMapsUrl } from "@/lib/address";
import { EASE_OUT } from "@/lib/motion";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Yoglait" },
      { name: "description", content: "Look up your Yoglait orders by phone number." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const reduce = useReducedMotion();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [updatesByOrder, setUpdatesByOrder] = useState<Map<string, OrderUpdate[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const trimmedPhone = phone.trim();
      const results = await lookupOrdersByPhone(trimmedPhone);
      setOrders(results);
      setSearched(true);

      // Best-effort — staff updates are a nice-to-have on this page, not
      // the reason the customer is here, so a failure here shouldn't block
      // showing the order results that already succeeded.
      try {
        const updates = await lookupOrderUpdatesByPhone(trimmedPhone);
        const grouped = new Map<string, OrderUpdate[]>();
        for (const u of updates) {
          const list = grouped.get(u.order_id) ?? [];
          list.push(u);
          grouped.set(u.order_id, list);
        }
        setUpdatesByOrder(grouped);
      } catch (updateErr) {
        console.warn("Could not load order updates:", updateErr);
        setUpdatesByOrder(new Map());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not look up orders.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-hero-gradient px-5 pt-32 pb-24 sm:px-8 sm:pt-40">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Track your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the phone number you used at checkout to see your recent orders.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <input
            required
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="020 000 0000"
            className="w-full rounded-full bg-card px-5 py-3 text-sm shadow-soft outline-none ring-primary/40 focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Search"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        {searched && !loading && orders && orders.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60">
              <PackageSearch className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">
              No orders found for that number. Double-check it matches what you used at checkout.
            </p>
          </div>
        )}

        {orders && orders.length > 0 && (
          <ul className="mt-8 flex flex-col gap-3">
            {orders.map((order, i) => (
              <motion.li
                key={order.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: EASE_OUT, delay: i * 0.04 }}
                className="rounded-3xl bg-card p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-bold">{order.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-GH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <StatusBadge
                      label={order.payment_status}
                      tone={
                        order.payment_status === "paid"
                          ? "good"
                          : order.payment_status === "failed"
                            ? "bad"
                            : "warn"
                      }
                    />
                    <StatusBadge
                      label={order.delivery_status.replace("_", " ")}
                      tone={order.delivery_status === "delivered" ? "good" : "neutral"}
                    />
                  </div>
                </div>

                <ul className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.name} × {item.qty}
                    </li>
                  ))}
                </ul>

                {(updatesByOrder.get(order.id)?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5 rounded-2xl bg-secondary/30 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Updates from Yoglait
                    </p>
                    {updatesByOrder.get(order.id)!.map((u) => (
                      <div key={u.id} className="text-xs">
                        <p className="text-foreground">{u.message}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(u.created_at).toLocaleString("en-GH", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="font-display text-base font-bold">GH₵ {order.total}</p>

                  {order.delivery_status !== "delivered" && (
                    <a
                      href={`https://wa.me/233205527771?text=${encodeURIComponent(
                        `Hi Yoglait! My order ${order.reference} hasn't been processed/received yet — could you please check on it?`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary transition-transform duration-150 hover:scale-105 active:scale-95"
                    >
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      Not received?
                    </a>
                  )}
                </div>

                {order.fulfillment_type === "pickup" ? (
                  <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Pickup at Yoglait, Tema Community 1, Accra
                    </span>
                    <a
                      href="https://www.google.com/maps?q=5.6450999,-0.0053953"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      View on map
                    </a>
                  </p>
                ) : order.address && isGpsAddress(order.address) ? (
                  <a
                    href={gpsMapsUrl(order.address)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-primary underline"
                  >
                    View delivery location
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">{order.address}</p>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "bad" | "warn" | "neutral";
}) {
  const toneClass = {
    good: "bg-primary/10 text-primary",
    bad: "bg-destructive/10 text-destructive",
    warn: "bg-secondary text-secondary-foreground",
    neutral: "bg-secondary/60 text-muted-foreground",
  }[tone];
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${toneClass}`}
    >
      {label}
    </span>
  );
}
