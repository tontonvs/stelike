import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCcw } from "lucide-react";
import { listOrders, confirmPaymentManually, markDelivered, type OrderRow } from "@/lib/orders";
import { StaffGate } from "@/components/StaffGate";
import type { StaffProfile } from "@/lib/staffAuth";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({ meta: [{ title: "Staff Dashboard — Yoglait" }] }),
  component: () => <StaffGate>{(staff) => <StaffDashboard staff={staff} />}</StaffGate>,
});

function StaffDashboard({ staff }: { staff: StaffProfile }) {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoadError(null);
    try {
      setOrders(await listOrders());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load orders.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfirmPayment = async (order: OrderRow) => {
    setBusyId(order.id);
    try {
      await confirmPaymentManually(order.id, staff.id);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not confirm payment.");
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkDelivered = async (order: OrderRow) => {
    setBusyId(order.id);
    try {
      await markDelivered(order.id, staff.id);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not mark delivered.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl pt-2">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-xs font-semibold shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh
        </button>
      </div>

      {loadError && (
        <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
          {loadError}
        </p>
      )}

      {orders === null ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-3xl bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-bold">{order.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer_name} · {order.customer_phone}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.address}</p>
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

              <div className="mt-3 flex items-center justify-between">
                <p className="font-display text-base font-bold">GH₵ {order.total}</p>
                <div className="flex gap-2">
                  {order.payment_status !== "paid" && (
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => handleConfirmPayment(order)}
                      className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
                    >
                      Confirm payment
                    </button>
                  )}
                  {order.payment_status === "paid" && order.delivery_status !== "delivered" && (
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => handleMarkDelivered(order)}
                      className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-bold text-secondary-foreground disabled:opacity-60"
                    >
                      Mark delivered
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
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
