import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  History,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Megaphone,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCcw,
  Send,
  Trash2,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import {
  listOrders,
  confirmPaymentManually,
  markDelivered,
  assignRider,
  listOrdersForStaff,
  listOrdersForRider,
  type OrderRow,
} from "@/lib/orders";
import { listOrderUpdates, sendOrderUpdate, type OrderUpdate } from "@/lib/orderUpdates";
import { listStaff, listStaffForLog, createSubAdmin } from "@/lib/staffAuth";
import { listRiders, addRider, terminateRider, type Rider } from "@/lib/riders";
import { isGpsAddress, gpsMapsUrl, extractLatLng, osmPreviewUrl } from "@/lib/address";
import { buildWhatsAppLink, riderDeliveryMessage } from "@/lib/whatsapp";
import {
  fetchAllProductsForStaff,
  createProduct,
  updateProduct,
  setProductActive,
  setProductInStock,
  deleteProduct,
  slugifyProductId,
  type ProductRow,
  type ProductInput,
} from "@/lib/productsApi";
import {
  lineLabels,
  flavourLabels,
  type Line,
  type Format,
  type Flavour,
  type Badge,
} from "@/lib/products";
import {
  listAnnouncementsForStaff,
  createAnnouncement,
  setAnnouncementActive,
  deleteAnnouncement,
  type Announcement,
  type AnnouncementType,
} from "@/lib/announcements";
import { StaffGate } from "@/components/StaffGate";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { fadeUp, staggerParent, EASE_OUT } from "@/lib/motion";
import type { StaffProfile } from "@/lib/staffAuth";

/** Today: just the time. Anything older: date + time, so a glance at the
 * card tells you "is this fresh or has it been sitting a while" without
 * doing date math in your head. */
function formatOrderTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" });
  if (isToday) return time;
  const dateStr = date.toLocaleDateString("en-GH", { day: "numeric", month: "short" });
  return `${dateStr} · ${time}`;
}

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
  const [tab, setTab] = useState<"orders" | "riders" | "menu" | "announcements" | "team" | "log">(
    "orders",
  );

  return (
    <div className="mx-auto max-w-3xl pt-2">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
          Orders
        </TabButton>
        <TabButton active={tab === "riders"} onClick={() => setTab("riders")}>
          Riders
        </TabButton>
        <TabButton active={tab === "menu"} onClick={() => setTab("menu")}>
          Menu
        </TabButton>
        <TabButton active={tab === "announcements"} onClick={() => setTab("announcements")}>
          Announcements
        </TabButton>
        {staff.role === "admin" && (
          <>
            <span aria-hidden="true" className="mx-1 text-sm font-bold text-muted-foreground">
              |
            </span>
            <TabButton active={tab === "team"} onClick={() => setTab("team")}>
              Team
            </TabButton>
            <TabButton active={tab === "log"} onClick={() => setTab("log")}>
              Log
            </TabButton>
          </>
        )}
      </div>

      {tab === "orders" && <OrdersPanel staff={staff} />}
      {tab === "riders" && <RidersPanel />}
      {tab === "menu" && <MenuPanel />}
      {tab === "announcements" && <AnnouncementsPanel staff={staff} />}
      {tab === "team" && <TeamPanel currentStaffId={staff.id} />}
      {tab === "log" && <EmployeeLogPanel />}
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
  const [justDeliveredId, setJustDeliveredId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const [expandedUpdatesId, setExpandedUpdatesId] = useState<string | null>(null);
  const [updatesByOrder, setUpdatesByOrder] = useState<Map<string, OrderUpdate[]>>(new Map());
  const [loadingUpdatesId, setLoadingUpdatesId] = useState<string | null>(null);
  const [updateDraft, setUpdateDraft] = useState("");
  const [sendingUpdate, setSendingUpdate] = useState(false);

  const now = new Date();
  const [showHistory, setShowHistory] = useState(false);
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterMonth, setFilterMonth] = useState<number | "all">("all");
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

  // Live refresh: push-based via Supabase Realtime rather than polling — any
  // insert/update on orders (a new order, a webhook confirming payment, another
  // staff member acting) refreshes this view immediately, not on a timer delay.
  useEffect(() => {
    const channel = supabase
      .channel("staff-orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const twoWeeksAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d;
  }, []);

  const filteredOrders = useMemo(() => {
    if (!orders) return null;
    if (!showHistory) {
      return orders.filter((o) => new Date(o.created_at) >= twoWeeksAgo);
    }
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
  }, [orders, showHistory, twoWeeksAgo, filterYear, filterMonth, filterStaffId]);

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
    setJustDeliveredId(order.id);
    try {
      // Let the checkmark animation actually be seen before the list reloads
      // and the button disappears (delivery_status flips, hiding it).
      await Promise.all([
        markDelivered(order.id, staff.id),
        new Promise((r) => setTimeout(r, 700)),
      ]);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not mark delivered.");
      setJustDeliveredId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleAssignRider = async (order: OrderRow, riderId: string) => {
    const rider = riders.find((r) => r.id === riderId);
    if (!rider) return;
    setBusyId(order.id);
    try {
      await assignRider(order.id, rider.id, rider.name, rider.phone);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not assign rider.");
    } finally {
      setBusyId(null);
      setAssigningId(null);
    }
  };

  // Lazy-loaded per order — most orders are never expanded, so this avoids
  // an N+1 fetch of updates for every order on every page load/refresh.
  const handleToggleUpdates = async (orderId: string) => {
    if (expandedUpdatesId === orderId) {
      setExpandedUpdatesId(null);
      return;
    }
    setExpandedUpdatesId(orderId);
    if (updatesByOrder.has(orderId)) return;
    setLoadingUpdatesId(orderId);
    try {
      const updates = await listOrderUpdates(orderId);
      setUpdatesByOrder((prev) => new Map(prev).set(orderId, updates));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load updates.");
    } finally {
      setLoadingUpdatesId(null);
    }
  };

  const handleSendUpdate = async (orderId: string) => {
    const message = updateDraft.trim();
    if (!message) return;
    setSendingUpdate(true);
    try {
      await sendOrderUpdate(orderId, message, staff.id);
      const updates = await listOrderUpdates(orderId);
      setUpdatesByOrder((prev) => new Map(prev).set(orderId, updates));
      setUpdateDraft("");
      toast.success("Update sent — the customer will see it via order lookup.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send update.");
    } finally {
      setSendingUpdate(false);
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

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {showHistory ? "Browsing order history" : "Showing the last 2 weeks"}
        </p>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-150 ${
            showHistory
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground shadow-soft"
          }`}
        >
          {showHistory ? "Back to recent" : "History"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="mt-3 flex flex-wrap items-center gap-2"
          >
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
              onChange={(e) =>
                setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))
              }
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
            {(filterMonth !== "all" || filterYear !== "all" || filterStaffId !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setFilterMonth("all");
                  setFilterYear("all");
                  setFilterStaffId("all");
                }}
                className="text-xs font-semibold text-muted-foreground underline"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-sm font-bold">{order.reference}</p>
                      <span className="text-[11px] text-muted-foreground">
                        · {formatOrderTimestamp(order.created_at)}
                      </span>
                    </div>
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
                        <p className="text-[11px] text-muted-foreground">
                          {order.rider_phone ?? "No phone on file"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {order.rider_phone ? (
                          <a
                            href={buildWhatsAppLink(order.rider_phone, riderDeliveryMessage(order))}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
                          >
                            <Send className="h-3 w-3" aria-hidden="true" /> Send details
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            Share details manually
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setAssigningId(order.id)}
                          className="text-[11px] font-semibold text-muted-foreground underline"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : assigningId === order.id || riders.filter((r) => r.active).length === 0 ? (
                    riders.filter((r) => r.active).length === 0 ? (
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
                        {riders
                          .filter((r) => r.active)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} · {r.phone ?? "no phone"}
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

                {/* Per-order updates — sent to the customer, surfaced via
                    phone lookup on the public /orders page. */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleToggleUpdates(order.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-150 ${
                        expandedUpdatesId === order.id ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                    Updates
                    {(updatesByOrder.get(order.id)?.length ?? 0) > 0 &&
                      ` (${updatesByOrder.get(order.id)!.length})`}
                  </button>

                  {expandedUpdatesId === order.id && (
                    <div className="mt-2 flex flex-col gap-2 rounded-2xl bg-secondary/30 p-3">
                      {loadingUpdatesId === order.id ? (
                        <Loader2
                          className="h-4 w-4 animate-spin text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        (updatesByOrder.get(order.id) ?? []).map((u) => (
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
                        ))
                      )}
                      <div className="flex gap-2">
                        <input
                          value={updateDraft}
                          onChange={(e) => setUpdateDraft(e.target.value)}
                          placeholder="e.g. Running 20 mins late"
                          className="w-full rounded-xl bg-card px-3 py-2 text-xs outline-none ring-primary/40 focus:ring-2"
                        />
                        <button
                          type="button"
                          disabled={sendingUpdate || !updateDraft.trim()}
                          onClick={() => handleSendUpdate(order.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                        >
                          {sendingUpdate ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="font-display text-base font-bold">GH₵ {order.total}</p>
                  <div className="flex gap-2">
                    {order.payment_status !== "paid" && (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => handleConfirmPayment(order)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Confirm payment
                      </button>
                    )}
                    {order.payment_status === "paid" && order.delivery_status !== "delivered" && (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => handleMarkDelivered(order)}
                        className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-90"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {justDeliveredId === order.id ? (
                            <motion.span
                              key="done"
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.25, ease: EASE_OUT }}
                              className="inline-flex items-center gap-1.5"
                            >
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.05 }}
                              >
                                <Check className="h-4 w-4" aria-hidden="true" />
                              </motion.span>
                              Delivered!
                            </motion.span>
                          ) : (
                            <motion.span
                              key="idle"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="inline-flex items-center gap-1.5"
                            >
                              <PackageCheck className="h-4 w-4" aria-hidden="true" />
                              Mark delivered
                            </motion.span>
                          )}
                        </AnimatePresence>
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
                        aria-label={`Terminate ${member.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-transform duration-150 hover:scale-110 hover:text-destructive active:scale-95"
                      >
                        <UserX className="h-4 w-4" aria-hidden="true" />
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

  const [form, setForm] = useState({ name: "", contact: "", password: "" });
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
      await addRider(form.name, form.contact, form.password);
      setForm({ name: "", contact: "", password: "" });
      await load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add rider.");
    } finally {
      setAdding(false);
    }
  };

  const handleTerminate = async (rider: Rider) => {
    if (
      !window.confirm(
        `Terminate ${rider.name}? They'll lose rider-login access and won't be assignable to new orders, but stay visible in the employee log with their delivery history.`,
      )
    )
      return;
    setBusyId(rider.id);
    try {
      await terminateRider(rider.id);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not terminate rider.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">Add a rider</h2>
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Email or phone number
            </span>
            <input
              required
              placeholder="e.g. 020 000 0000 or rider@email.com"
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Password
            </span>
            <input
              required
              type="password"
              minLength={6}
              placeholder="Rider will use this to sign in"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </label>

          <p className="text-[11px] text-muted-foreground">
            Riders registered with a phone number get delivery details sent via WhatsApp; riders
            registered with email only don&apos;t (no phone to message), and staff will need to
            share details another way.
          </p>

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
        <p className="mt-1 text-xs text-muted-foreground">
          Terminated riders move to the Log tab, along with sub-admins.
        </p>

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
        ) : riders.filter((r) => r.active).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No riders added yet.</p>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={staggerParent}
            className="mt-3 flex flex-col gap-2"
          >
            {riders
              .filter((r) => r.active)
              .map((rider) => (
                <motion.li
                  key={rider.id}
                  variants={fadeUp}
                  className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-soft"
                >
                  <div>
                    <p className="text-sm font-semibold">{rider.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rider.phone ?? rider.email ?? "No contact on file"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === rider.id}
                    onClick={() => handleTerminate(rider)}
                    aria-label={`Terminate ${rider.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-transform duration-150 hover:scale-110 hover:text-destructive active:scale-95 disabled:opacity-50"
                  >
                    <UserX className="h-4 w-4" aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}

const LINES: Line[] = ["drinking", "probiotic", "greek", "cups"];
const FORMATS: Format[] = ["pouch", "tub", "cup"];
const FLAVOURS: Flavour[] = [
  "plain",
  "vanilla",
  "strawberry",
  "banana",
  "pineapple",
  "lime",
  "coconut",
];
const BADGES: Badge[] = [
  "NEW",
  "High Protein",
  "Low Fat",
  "Low Sugar",
  "No Preservatives",
  "Contains Iron",
  "Probiotic",
];

const emptyProductForm: ProductInput = {
  name: "",
  line: "drinking",
  format: "pouch",
  flavour: "plain",
  size: "",
  price: 0,
  tagline: "",
  description: "",
  badges: [],
  active: true,
  in_stock: true,
};

function ProductForm({
  value,
  onChange,
}: {
  value: ProductInput;
  onChange: (next: ProductInput) => void;
}) {
  const toggleBadge = (badge: Badge) => {
    const has = value.badges.includes(badge);
    onChange({
      ...value,
      badges: has ? value.badges.filter((b) => b !== badge) : [...value.badges, badge],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Name</span>
        <input
          required
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Line</span>
          <select
            value={value.line}
            onChange={(e) => onChange({ ...value, line: e.target.value as Line })}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          >
            {LINES.map((l) => (
              <option key={l} value={l}>
                {lineLabels[l]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Format</span>
          <select
            value={value.format}
            onChange={(e) => onChange({ ...value, format: e.target.value as Format })}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Flavour</span>
          <select
            value={value.flavour}
            onChange={(e) => onChange({ ...value, flavour: e.target.value as Flavour })}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          >
            {FLAVOURS.map((f) => (
              <option key={f} value={f}>
                {flavourLabels[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Size</span>
          <input
            required
            placeholder="e.g. 250ml pouch"
            value={value.size}
            onChange={(e) => onChange({ ...value, size: e.target.value })}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          Price (GH₵)
        </span>
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={value.price || ""}
          onChange={(e) => onChange({ ...value, price: Number(e.target.value) })}
          className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          Tagline (optional)
        </span>
        <input
          value={value.tagline}
          onChange={(e) => onChange({ ...value, tagline: e.target.value })}
          className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          Description (optional)
        </span>
        <textarea
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={2}
          className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
        />
      </label>
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Badges</span>
        <div className="flex flex-wrap gap-1.5">
          {BADGES.map((b) => {
            const active = value.badges.includes(b);
            return (
              <button
                key={b}
                type="button"
                onClick={() => toggleBadge(b)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground"
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <input
          type="checkbox"
          checked={value.active}
          onChange={(e) => onChange({ ...value, active: e.target.checked })}
          className="h-4 w-4 rounded"
        />
        Show on the public Menu
      </label>
      <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <input
          type="checkbox"
          checked={value.in_stock}
          onChange={(e) => onChange({ ...value, in_stock: e.target.checked })}
          className="h-4 w-4 rounded"
        />
        Currently in stock
      </label>
      {value.active && !value.in_stock && (
        <p className="text-[11px] text-muted-foreground">
          Still shown on the Menu, greyed out with an "Out of stock" label — customers can't add it
          to cart. Use "Show on the public Menu" instead if it should disappear entirely.
        </p>
      )}
    </div>
  );
}

function MenuPanel() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<ProductInput>(emptyProductForm);
  const [savingNew, setSavingNew] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductInput>(emptyProductForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoadError(null);
    try {
      setProducts(await fetchAllProductsForStaff());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load products.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<Line, ProductRow[]>();
    for (const p of products ?? []) {
      const list = map.get(p.line) ?? [];
      list.push(p);
      map.set(p.line, list);
    }
    return map;
  }, [products]);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingNew(true);
    try {
      const id = slugifyProductId(addForm.name);
      if (!id) throw new Error("Enter a product name first.");
      await createProduct(id, addForm);
      toast.success(`${addForm.name} added to the menu.`);
      setAddForm(emptyProductForm);
      setAdding(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add product.");
    } finally {
      setSavingNew(false);
    }
  };

  const startEdit = (product: ProductRow) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      line: product.line,
      format: product.format,
      flavour: product.flavour,
      size: product.size,
      price: Number(product.price),
      tagline: product.tagline ?? "",
      description: product.description ?? "",
      badges: product.badges,
      active: product.active,
      in_stock: product.in_stock,
    });
  };

  const handleSaveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    setSavingEdit(true);
    try {
      await updateProduct(editingId, editForm);
      toast.success("Product updated.");
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (product: ProductRow) => {
    setBusyId(product.id);
    try {
      await setProductActive(product.id, !product.active);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update availability.");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleInStock = async (product: ProductRow) => {
    setBusyId(product.id);
    try {
      await setProductInStock(product.id, !product.in_stock);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update stock status.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (product: ProductRow) => {
    if (!window.confirm(`Permanently delete "${product.name}"? This can't be undone.`)) return;
    setBusyId(product.id);
    try {
      await deleteProduct(product.id);
      toast.success(`${product.name} deleted.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete product.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Add a product</h2>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {adding ? "Cancel" : "New"}
          </button>
        </div>

        {adding && (
          <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3">
            <ProductForm value={addForm} onChange={setAddForm} />
            <p className="text-[11px] text-muted-foreground">
              New products use a placeholder image until a real image asset is added to the codebase
              for this item — editing an existing product's other fields isn't affected.
            </p>
            <button
              type="submit"
              disabled={savingNew}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
            >
              {savingNew ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {savingNew ? "Adding…" : "Add product"}
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 className="font-display text-lg font-bold">Menu</h2>

        {loadError && (
          <p className="mt-3 rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
            {loadError}
          </p>
        )}

        {products === null ? (
          <ul className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </ul>
        ) : (
          <div className="mt-3 flex flex-col gap-5">
            {LINES.filter((l) => (grouped.get(l) ?? []).length > 0).map((line) => (
              <div key={line}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {lineLabels[line]}
                </p>
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={staggerParent}
                  className="flex flex-col gap-2"
                >
                  {(grouped.get(line) ?? []).map((product) => (
                    <motion.li
                      key={product.id}
                      variants={fadeUp}
                      className="rounded-2xl bg-card p-4 shadow-soft"
                    >
                      {editingId === product.id ? (
                        <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
                          <ProductForm value={editForm} onChange={setEditForm} />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingEdit}
                              className="flex-1 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-70"
                            >
                              {savingEdit ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">
                              {product.name}{" "}
                              {!product.active && (
                                <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                                  Hidden
                                </span>
                              )}
                              {product.active && !product.in_stock && (
                                <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                                  Out of stock
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.size} · GH₵ {product.price}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(product)}
                              aria-label={`Edit ${product.name}`}
                              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-transform duration-150 hover:scale-110 hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              disabled={busyId === product.id}
                              onClick={() => handleToggleInStock(product)}
                              className="rounded-full bg-secondary/60 px-2.5 py-1 text-[10px] font-bold text-muted-foreground disabled:opacity-50"
                            >
                              {product.in_stock ? "Mark out of stock" : "Mark in stock"}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === product.id}
                              onClick={() => handleToggleActive(product)}
                              className="rounded-full bg-secondary/60 px-2.5 py-1 text-[10px] font-bold text-muted-foreground disabled:opacity-50"
                            >
                              {product.active ? "Hide" : "Show"}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === product.id}
                              onClick={() => handleDelete(product)}
                              aria-label={`Delete ${product.name}`}
                              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-transform duration-150 hover:scale-110 hover:text-destructive disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const DURATION_OPTIONS: { label: string; days: number | null }[] = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "No expiry", days: null },
];

function AnnouncementsPanel({ staff }: { staff: StaffProfile }) {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [type, setType] = useState<AnnouncementType>("notice");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [durationDays, setDurationDays] = useState<number | null>(7);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoadError(null);
    try {
      setAnnouncements(await listAnnouncementsForStaff());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load announcements.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createAnnouncement({ type, title, body, imageFile, durationDays }, staff.id);
      toast.success(
        type === "advert" ? "Advert live — it'll pop up on the next site visit." : "Notice posted.",
      );
      setTitle("");
      setBody("");
      setImageFile(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create announcement.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (a: Announcement) => {
    setBusyId(a.id);
    try {
      await setAnnouncementActive(a.id, !a.active);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update announcement.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (a: Announcement) => {
    if (!window.confirm(`Delete "${a.title}"? This can't be undone.`)) return;
    setBusyId(a.id);
    try {
      await deleteAnnouncement(a.id);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete announcement.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">New announcement</h2>
        <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("notice")}
              className={`flex-1 rounded-full py-2 text-xs font-bold ${
                type === "notice"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground"
              }`}
            >
              Notice
            </button>
            <button
              type="button"
              onClick={() => setType("advert")}
              className={`flex-1 rounded-full py-2 text-xs font-bold ${
                type === "advert"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground"
              }`}
            >
              Advert
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {type === "advert"
              ? "Pops up with a golden-rays animation, then disappears — not kept in the bell list."
              : "Pops up once, and stays listed in the notification bell until it expires."}
          </p>

          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          <textarea
            required
            placeholder="Message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />

          <label className="flex items-center gap-2 rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{imageFile ? imageFile.name : "Image (optional)"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="ml-auto text-xs"
            />
          </label>

          <select
            value={durationDays ?? "none"}
            onChange={(e) =>
              setDurationDays(e.target.value === "none" ? null : Number(e.target.value))
            }
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.days ?? "none"}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Megaphone className="h-4 w-4" aria-hidden="true" />
            )}
            {creating ? "Posting…" : "Post announcement"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold">All announcements</h2>

        {loadError && (
          <p className="mt-3 rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
            {loadError}
          </p>
        )}

        {announcements === null ? (
          <ul className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </ul>
        ) : announcements.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={staggerParent}
            className="mt-3 flex flex-col gap-2"
          >
            {announcements.map((a) => (
              <motion.li
                key={a.id}
                variants={fadeUp}
                className="flex items-center justify-between gap-2 rounded-2xl bg-card px-4 py-3 shadow-soft"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {a.title}{" "}
                    <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                      {a.type}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.active ? "Active" : "Inactive"}
                    {a.expires_at &&
                      ` · expires ${new Date(a.expires_at).toLocaleDateString("en-GH", {
                        day: "numeric",
                        month: "short",
                      })}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => handleToggleActive(a)}
                    className="rounded-full bg-secondary/60 px-2.5 py-1 text-[10px] font-bold text-muted-foreground disabled:opacity-50"
                  >
                    {a.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => handleDelete(a)}
                    aria-label={`Delete ${a.title}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-transform duration-150 hover:scale-110 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}

type EmployeeLogEntry = {
  id: string;
  name: string;
  type: "Sub-admin" | "Rider";
  createdAt: string;
  terminatedAt: string | null;
  contact: string | null;
};

type LogSortMode = "name" | "date";
type LogStatusFilter = "all" | "active" | "terminated";

function formatLogDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatHistoryDate(iso: string) {
  return new Date(iso).toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Admin-only. A read-oriented log of every sub-admin and rider ever added —
 * unlike the Team/Riders tabs (which only show who's currently active),
 * this includes terminated people too, since the whole point is keeping
 * their history around after they're gone. */
function EmployeeLogPanel() {
  const [entries, setEntries] = useState<EmployeeLogEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<LogSortMode>("name");
  const [statusFilter, setStatusFilter] = useState<LogStatusFilter>("all");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyByEntry, setHistoryByEntry] = useState<Map<string, OrderRow[]>>(new Map());
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const load = async () => {
    setLoadError(null);
    try {
      const [subAdmins, riders] = await Promise.all([listStaffForLog(), listRiders()]);
      const combined: EmployeeLogEntry[] = [
        ...subAdmins.map((s) => ({
          id: s.id,
          name: s.name,
          type: "Sub-admin" as const,
          createdAt: s.created_at,
          terminatedAt: s.terminated_at,
          contact: null,
        })),
        ...riders.map((r) => ({
          id: r.id,
          name: r.name,
          type: "Rider" as const,
          createdAt: r.created_at,
          terminatedAt: r.terminated_at,
          contact: r.phone ?? r.email,
        })),
      ];
      setEntries(combined);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load the employee log.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = entries ?? [];
    if (statusFilter === "active") list = list.filter((e) => !e.terminatedAt);
    if (statusFilter === "terminated") list = list.filter((e) => !!e.terminatedAt);

    const sorted = [...list];
    if (sortMode === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [entries, statusFilter, sortMode]);

  const handleToggleHistory = async (entry: EmployeeLogEntry) => {
    if (expandedId === entry.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(entry.id);
    setHistoryError(null);
    if (historyByEntry.has(entry.id)) return;
    setLoadingHistoryId(entry.id);
    try {
      const orders =
        entry.type === "Sub-admin"
          ? await listOrdersForStaff(entry.id)
          : await listOrdersForRider(entry.id, entry.name);
      setHistoryByEntry((prev) => new Map(prev).set(entry.id, orders));
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Could not load history.");
    } finally {
      setLoadingHistoryId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Employee log</h2>
        <div className="flex gap-2">
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as LogSortMode)}
            aria-label="Sort by"
            className="rounded-full bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground outline-none"
          >
            <option value="name">Name A–Z</option>
            <option value="date">Date added</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LogStatusFilter)}
            aria-label="Filter by status"
            className="rounded-full bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground outline-none"
          >
            <option value="all">All</option>
            <option value="active">Still around</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {loadError && (
        <p className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
          {loadError}
        </p>
      )}

      {entries === null ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one matches this filter.</p>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={staggerParent}
          className="flex flex-col gap-2"
        >
          {filtered.map((entry) => (
            <motion.li
              key={`${entry.type}-${entry.id}`}
              variants={fadeUp}
              className="rounded-2xl bg-card p-4 shadow-soft"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {entry.name}{" "}
                    <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                      {entry.type}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added {formatLogDate(entry.createdAt)}
                    {entry.terminatedAt ? (
                      <>
                        {" "}
                        · <span className="text-destructive">Terminated</span>{" "}
                        {formatLogDate(entry.terminatedAt)}
                      </>
                    ) : (
                      <>
                        {" "}
                        · <span className="text-primary">Still around</span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleHistory(entry)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary/60 px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
                >
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  History
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-150 ${
                      expandedId === entry.id ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {expandedId === entry.id && (
                <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-secondary/30 p-3">
                  {loadingHistoryId === entry.id ? (
                    <Loader2
                      className="h-4 w-4 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : historyError ? (
                    <p className="text-xs font-medium text-destructive">{historyError}</p>
                  ) : (historyByEntry.get(entry.id) ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {entry.type === "Sub-admin"
                        ? "No confirmed or delivered orders yet."
                        : "No completed deliveries yet."}
                    </p>
                  ) : (
                    (historyByEntry.get(entry.id) ?? []).map((order) => {
                      const didConfirm = order.confirmed_by === entry.id;
                      const didDeliver = order.delivered_by === entry.id;
                      return (
                        <div key={order.id} className="text-xs">
                          <p className="font-semibold text-foreground">{order.reference}</p>
                          {entry.type === "Sub-admin" ? (
                            <>
                              {didConfirm && (
                                <p className="text-muted-foreground">
                                  Confirmed payment
                                  {order.paid_at && ` · ${formatHistoryDate(order.paid_at)}`}
                                </p>
                              )}
                              {didDeliver && (
                                <p className="text-muted-foreground">
                                  Marked delivered
                                  {order.delivered_at &&
                                    ` · ${formatHistoryDate(order.delivered_at)}`}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-muted-foreground">
                              Delivered
                              {order.delivered_at && ` · ${formatHistoryDate(order.delivered_at)}`}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
