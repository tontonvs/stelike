import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2, MapPin, RefreshCcw, Send, Trash2, UserPlus } from "lucide-react";
import {
  listOrders,
  confirmPaymentManually,
  markDelivered,
  assignRider,
  type OrderRow,
} from "@/lib/orders";
import { listStaff, createSubAdmin } from "@/lib/staffAuth";
import { listRiders, addRider, removeRider, type Rider } from "@/lib/riders";
import { isGpsAddress, gpsMapsUrl, extractLatLng, osmPreviewUrl } from "@/lib/address";
import { buildWhatsAppLink, riderDeliveryMessage } from "@/lib/whatsapp";
import { StaffGate } from "@/components/StaffGate";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeUp, staggerParent, EASE_OUT } from "@/lib/motion";
import type { StaffProfile } from "@/lib/staffAuth";

function OrderCardSkeleton() {
  return (
    <li className="rounded-3xl bg-card p-5 shadow-soft" aria-hidden="true">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="mt-2 h-3 w-40 rounded-full" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="mt-3 h-3 w-2/3 rounded-full" />
      <Skeleton className="mt-1.5 h-3 w-1/2 rounded-full" />
      <Skeleton className="mt-3 h-14 w-full rounded-2xl" />
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
    </li>
  );
}

function ListRowSkeleton() {
  return (
    <li
      className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-soft"
      aria-hidden="true"
    >
      <div>
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="mt-1.5 h-3 w-20 rounded-full" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </li>
  );
}

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

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function OrdersPanel({ staff }: { staff: StaffProfile }) {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffProfile[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const now = new Date();
  const [filterYear, setFilterYear] = useState<number | "all">(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | "all">(now.getMonth());
  const [filterStaffId, setFilterStaffId] = useState<string | "all">("all");

  const load = async () => {
    setLoadError(null);
    try {
      const [ordersResult, ridersResult, staffResult] = await Promise.all([
        listOrders(),
        listRiders(),
        listStaff(),
      ]);
      setOrders(ordersResult);
      setRiders(ridersResult.filter((r) => r.active));
      setStaffMembers(staffResult);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load orders.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const staffNameById = useMemo(
    () => new Map(staffMembers.map((s) => [s.id, s.name])),
    [staffMembers],
  );

  const availableYears = useMemo(() => {
    const years = new Set<number>([now.getFullYear()]);
    (orders ?? []).forEach((o) => years.add(new Date(o.created_at).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return null;
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      if (filterYear !== "all" && d.getFullYear() !== filterYear) return false;
      if (filterMonth !== "all" && d.getMonth() !== filterMonth) return false;
      if (
        filterStaffId !== "all" &&
        o.confirmed_by !== filterStaffId &&
        o.delivered_by !== filterStaffId
      )
        return false;
      return true;
    });
  }, [orders, filterYear, filterMonth, filterStaffId]);

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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={filterMonth}
          onChange={(e) =>
            setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-soft outline-none"
        >
          <option value="all">All months</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-soft outline-none"
        >
          <option value="all">All years</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={filterStaffId}
          onChange={(e) => setFilterStaffId(e.target.value)}
          className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-soft outline-none"
        >
          <option value="all">Any staff</option>
          {staffMembers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {(filterMonth !== now.getMonth() ||
          filterYear !== now.getFullYear() ||
          filterStaffId !== "all") && (
          <button
            type="button"
            onClick={() => {
              setFilterMonth(now.getMonth());
              setFilterYear(now.getFullYear());
              setFilterStaffId("all");
            }}
            className="text-xs font-semibold text-muted-foreground underline"
          >
            Reset to this month
          </button>
        )}
      </div>

      {loadError && (
        <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
          {loadError}
        </p>
      )}

      {filteredOrders === null ? (
        <ul className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </ul>
      ) : filteredOrders.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No orders match this filter.
        </p>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={staggerParent}
          className="mt-6 flex flex-col gap-3"
        >
          {filteredOrders.map((order) => {
            const coords = isGpsAddress(order.address) ? extractLatLng(order.address) : null;

            return (
              <motion.li
                key={order.id}
                variants={fadeUp}
                className="rounded-3xl bg-card p-5 shadow-soft"
              >
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

                {(order.confirmed_by || order.delivered_by) && (
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    {order.confirmed_by && (
                      <p className="text-[11px] text-muted-foreground">
                        Payment confirmed by{" "}
                        <span className="font-semibold text-foreground">
                          {staffNameById.get(order.confirmed_by) ?? "a staff member"}
                        </span>
                      </p>
                    )}
                    {order.delivered_by && (
                      <p className="text-[11px] text-muted-foreground">
                        Delivered by{" "}
                        <span className="font-semibold text-foreground">
                          {staffNameById.get(order.delivered_by) ?? "a staff member"}
                        </span>
                      </p>
                    )}
                  </div>
                )}

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
              </motion.li>
            );
          })}
        </motion.ul>
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

import { RemoveStaffDialog } from "@/components/RemoveStaffDialog";

function TeamPanel({ currentStaffId }: { currentStaffId: string }) {
  const [staff, setStaff] = useState<StaffProfile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<StaffProfile | null>(null);

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

  const admins = staff?.filter((s) => s.role === "admin") ?? [];
  const subAdmins = staff?.filter((s) => s.role === "sub_admin") ?? [];

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
          <ul className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </ul>
        ) : (
          <div className="mt-3 flex flex-col gap-5">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Admins ({admins.length})
              </p>
              <motion.ul
                initial="hidden"
                animate="show"
                variants={staggerParent}
                className="flex flex-col gap-2"
              >
                {admins.map((member) => (
                  <motion.li
                    key={member.id}
                    variants={fadeUp}
                    className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {member.name} {member.id === currentStaffId && "(you)"}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-primary">Admin</p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Sub-admins ({subAdmins.length})
              </p>
              {subAdmins.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sub-admins yet.</p>
              ) : (
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={staggerParent}
                  className="flex flex-col gap-2"
                >
                  {subAdmins.map((member) => (
                    <motion.li
                      key={member.id}
                      variants={fadeUp}
                      className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-soft"
                    >
                      <div>
                        <p className="text-sm font-semibold">{member.name}</p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Sub-admin
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRemovingMember(member)}
                        aria-label={`Remove ${member.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-transform duration-150 hover:scale-110 hover:text-destructive active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          </div>
        )}
      </div>

      {removingMember && (
        <RemoveStaffDialog
          member={removingMember}
          onClose={() => setRemovingMember(null)}
          onRemoved={load}
        />
      )}
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
          <ul className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </ul>
        ) : riders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No riders added yet.</p>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={staggerParent}
            className="mt-3 flex flex-col gap-2"
          >
            {riders.map((rider) => (
              <motion.li
                key={rider.id}
                variants={fadeUp}
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
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
