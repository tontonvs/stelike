import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MapPin, RefreshCcw, Send, Trash2, UserPlus } from "lucide-react";
import {
  listOrders,
  confirmPaymentManually,
  markDelivered,
  assignRider,
  type OrderRow,
} from "@/lib/orders";
import { listStaff, removeStaff, createSubAdmin } from "@/lib/staffAuth";
import { listRiders, addRider, removeRider, type Rider } from "@/lib/riders";
import { isGpsAddress, gpsMapsUrl, extractLatLng, osmPreviewUrl } from "@/lib/address";
import { buildWhatsAppLink, riderDeliveryMessage } from "@/lib/whatsapp";
import { StaffGate } from "@/components/StaffGate";
import type { StaffProfile } from "@/lib/staffAuth";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({ meta: [{ title: "Staff Dashboard — Yoglait" }] }),
  component: () => <StaffGate>{(staff) => <StaffDashboard staff={staff} />}</StaffGate>,
});

function StaffDashboard({ staff }: { staff: StaffProfile }) {
  const [tab, setTab] = useState<"orders" | "riders" | "team">("orders");

  return (
    <div className="mx-auto max-w-3xl pt-2">
      <div className="mb-6 flex gap-2">
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
          Orders
        </TabButton>
        <TabButton active={tab === "riders"} onClick={() => setTab("riders")}>
          Riders
        </TabButton>
        {staff.role === "admin" && (
          <TabButton active={tab === "team"} onClick={() => setTab("team")}>
            Team
          </TabButton>
        )}
      </div>

      {tab === "orders" && <OrdersPanel staff={staff} />}
      {tab === "riders" && <RidersPanel />}
      {tab === "team" && <TeamPanel currentStaffId={staff.id} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 ${
        active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function OrdersPanel({ staff }: { staff: StaffProfile }) {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = async () => {
    setLoadError(null);
    try {
      const [ordersResult, ridersResult] = await Promise.all([listOrders(), listRiders()]);
      setOrders(ordersResult);
      setRiders(ridersResult.filter((r) => r.active));
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

  const handleAssignRider = async (order: OrderRow, riderId: string) => {
    const rider = riders.find((r) => r.id === riderId);
    if (!rider) return;
    setBusyId(order.id);
    try {
      await assignRider(order.id, rider.name, rider.phone);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not assign rider.");
    } finally {
      setBusyId(null);
      setAssigningId(null);
    }
  };

  return (
    <div>
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
          {orders.map((order) => {
            const coords = isGpsAddress(order.address) ? extractLatLng(order.address) : null;

            return (
              <li key={order.id} className="rounded-3xl bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-bold">{order.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer_name} · {order.customer_phone}
                    </p>
                    {!coords && <p className="text-xs text-muted-foreground">{order.address}</p>}
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

                {coords && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                    <iframe
                      title={`Delivery location for ${order.reference}`}
                      src={osmPreviewUrl(coords.lat, coords.lng)}
                      loading="lazy"
                      className="h-32 w-full border-0"
                    />
                    <a
                      href={gpsMapsUrl(order.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 bg-secondary/40 px-3 py-1.5 text-[11px] font-semibold text-primary"
                    >
                      <MapPin className="h-3 w-3" aria-hidden="true" /> Open in Google Maps
                    </a>
                  </div>
                )}

                <ul className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.name} × {item.qty}
                    </li>
                  ))}
                </ul>

                {/* Delivery assignment */}
                <div className="mt-3 rounded-2xl bg-secondary/30 p-3">
                  {order.rider_name ? (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{order.rider_name}</p>
                        <p className="text-[11px] text-muted-foreground">{order.rider_phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={buildWhatsAppLink(
                            order.rider_phone ?? "",
                            riderDeliveryMessage(order),
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
                        >
                          <Send className="h-3 w-3" aria-hidden="true" /> Send details
                        </a>
                        <button
                          type="button"
                          onClick={() => setAssigningId(order.id)}
                          className="text-[11px] font-semibold text-muted-foreground underline"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : assigningId === order.id || riders.length === 0 ? (
                    riders.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        No riders yet — add one in the Riders tab.
                      </p>
                    ) : (
                      <select
                        autoFocus
                        defaultValue=""
                        disabled={busyId === order.id}
                        onChange={(e) => e.target.value && handleAssignRider(order, e.target.value)}
                        className="w-full rounded-xl bg-card px-3 py-2 text-xs outline-none ring-primary/40 focus:ring-2"
                      >
                        <option value="" disabled>
                          Choose a rider…
                        </option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} · {r.phone}
                          </option>
                        ))}
                      </select>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAssigningId(order.id)}
                      className="text-xs font-semibold text-primary"
                    >
                      Assign a rider
                    </button>
                  )}
                </div>

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
            );
          })}
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

function RidersPanel() {
  const [riders, setRiders] = useState<Rider[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", phone: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = async () => {
    setLoadError(null);
    try {
      setRiders(await listRiders());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load riders.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      await addRider(form.name, form.phone);
      setForm({ name: "", phone: "" });
      await load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add rider.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (rider: Rider) => {
    if (!window.confirm(`Remove ${rider.name} from the rider list?`)) return;
    setBusyId(rider.id);
    try {
      await removeRider(rider.id);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not remove rider.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">Add a rider</h2>
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          <input
            required
            type="tel"
            inputMode="tel"
            placeholder="Phone (e.g. 020 000 0000)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />

          {addError && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
              {addError}
            </p>
          )}

          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Add rider"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold">Riders</h2>

        {loadError && (
          <p className="mt-3 rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
            {loadError}
          </p>
        )}

        {riders === null ? (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : riders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No riders added yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {riders.map((rider) => (
              <li
                key={rider.id}
                className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-soft"
              >
                <div>
                  <p className="text-sm font-semibold">{rider.name}</p>
                  <p className="text-xs text-muted-foreground">{rider.phone}</p>
                </div>
                <button
                  type="button"
                  disabled={busyId === rider.id}
                  onClick={() => handleRemove(rider)}
                  aria-label={`Remove ${rider.name}`}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-transform duration-150 hover:scale-110 hover:text-destructive active:scale-95 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
