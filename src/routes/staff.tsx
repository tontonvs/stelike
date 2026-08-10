import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCcw, Trash2, UserPlus } from "lucide-react";
import { listOrders, confirmPaymentManually, markDelivered, type OrderRow } from "@/lib/orders";
import { listStaff, removeStaff, createSubAdmin } from "@/lib/staffAuth";
import { StaffGate } from "@/components/StaffGate";
import type { StaffProfile } from "@/lib/staffAuth";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({ meta: [{ title: "Staff Dashboard — Yoglait" }] }),
  component: () => <StaffGate>{(staff) => <StaffDashboard staff={staff} />}</StaffGate>,
});

function StaffDashboard({ staff }: { staff: StaffProfile }) {
  const [tab, setTab] = useState<"orders" | "team">("orders");

  return (
    <div className="mx-auto max-w-3xl pt-2">
      {staff.role === "admin" && (
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 ${
              tab === "orders"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => setTab("team")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 ${
              tab === "team"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            Team
          </button>
        </div>
      )}

      {tab === "orders" ? <OrdersPanel staff={staff} /> : <TeamPanel currentStaffId={staff.id} />}
    </div>
  );
}

function OrdersPanel({ staff }: { staff: StaffProfile }) {
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

function TeamPanel({ currentStaffId }: { currentStaffId: string }) {
  const [staff, setStaff] = useState<StaffProfile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoadError(null);
    try {
      setStaff(await listStaff());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load team.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (member: StaffProfile) => {
    if (!window.confirm(`Remove ${member.name} as staff? They'll lose dashboard access.`)) return;
    setBusyId(member.id);
    try {
      await removeStaff(member.id);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not remove staff.");
    } finally {
      setBusyId(null);
    }
  };

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviting(true);
    try {
      const created = await createSubAdmin(form);
      setInviteSuccess(`${created.name} added as sub-admin.`);
      setForm({ name: "", email: "", password: "" });
      await load();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Could not create sub-admin.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">Add a sub-admin</h2>
        <form onSubmit={handleInvite} className="mt-4 flex flex-col gap-3">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Temporary password (min. 8 characters)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />

          {inviteError && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
              {inviteError}
            </p>
          )}
          {inviteSuccess && (
            <p className="rounded-2xl bg-primary/10 px-4 py-2.5 text-xs font-medium text-primary">
              {inviteSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={inviting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
          >
            {inviting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            )}
            {inviting ? "Adding…" : "Add sub-admin"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold">Current team</h2>

        {loadError && (
          <p className="mt-3 rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
            {loadError}
          </p>
        )}

        {staff === null ? (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {staff.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-soft"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {member.name} {member.id === currentStaffId && "(you)"}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {member.role === "admin" ? "Admin" : "Sub-admin"}
                  </p>
                </div>
                {member.role === "sub_admin" && (
                  <button
                    type="button"
                    disabled={busyId === member.id}
                    onClick={() => handleRemove(member)}
                    aria-label={`Remove ${member.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-transform duration-150 hover:scale-110 hover:text-destructive active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
