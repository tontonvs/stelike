import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  Copy,
  Loader2,
  MapPin,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/CartProvider";
import { resolveCartItems, cartSubtotal, DELIVERY_FEE } from "@/lib/cart";
import { categoryLabels } from "@/lib/products";
import { useProducts } from "@/hooks/useProducts";
import { payWithPaystack } from "@/lib/paystack";
import { createOrder, lookupOrdersByPhone, type OrderRow } from "@/lib/orders";
import { isGpsAddress, gpsMapsUrl, formatGpsAddress } from "@/lib/address";
import { EASE_OUT } from "@/lib/motion";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Yoglait" },
      {
        name: "description",
        content: "Complete your Yoglait order — delivery details and secure payment.",
      },
    ],
  }),
  component: CheckoutPage,
});

type Step = "details" | "summary" | "payment";
const steps: { id: Step; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "summary", label: "Summary" },
  { id: "payment", label: "Payment" },
];

type FulfillmentType = "delivery" | "pickup";
// Matches the address used elsewhere in the project's docs — update here if
// the shop ever moves or gains a more specific pickup address.
const PICKUP_LOCATION = "Yoglait, Tema Community 1, Accra";
const PICKUP_MAPS_URL = "https://www.google.com/maps?q=5.6450999,-0.0053953";

type FormState = { name: string; phone: string; email: string; address: string; note: string };
const emptyForm: FormState = { name: "", phone: "", email: "", address: "", note: "" };

function makeReference() {
  return `YOG-${Date.now().toString(36).toUpperCase()}`;
}

function CheckoutPage() {
  const { lines, clear } = useCart();
  const reduce = useReducedMotion();
  const { data: products } = useProducts();
  const [step, setStep] = useState<Step>("details");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("delivery");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [lookupMatch, setLookupMatch] = useState<OrderRow | null>(null);
  const [lookupDismissed, setLookupDismissed] = useState(false);
  const [addressMode, setAddressMode] = useState<"type" | "location">("location");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [addressError, setAddressError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const reference = useRef(makeReference());
  const submittingRef = useRef(false);

  const items = useMemo(() => resolveCartItems(lines, products ?? []), [lines, products]);
  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const deliveryFee = fulfillmentType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + (items.length > 0 ? deliveryFee : 0);

  const stepIndex = steps.findIndex((s) => s.id === step);

  // Returning-customer lookup: fires when the phone field loses focus. Best-effort —
  // a failed lookup (offline, RLS issue, etc.) should never block checkout, so errors
  // are swallowed here rather than surfaced.
  const handlePhoneBlur = async () => {
    const phone = form.phone.trim();
    if (phone.length < 9 || lookupDismissed || form.name.trim() || form.address.trim()) return;
    try {
      const matches = await lookupOrdersByPhone(phone);
      if (matches[0]) setLookupMatch(matches[0]);
    } catch {
      // Silent — lookup is a nice-to-have, not a checkout blocker.
    }
  };

  const copyPickupLink = async () => {
    try {
      await navigator.clipboard.writeText(PICKUP_MAPS_URL);
      toast.success("Location link copied.");
    } catch {
      toast.error("Could not copy — long-press the link instead.");
    }
  };

  const applyLookupMatch = () => {
    if (!lookupMatch) return;
    setFulfillmentType(lookupMatch.fulfillment_type);
    setForm((f) => ({
      ...f,
      name: lookupMatch.customer_name,
      email: lookupMatch.customer_email ?? "",
      address: lookupMatch.address ?? "",
    }));
    setAddressMode(lookupMatch.address && isGpsAddress(lookupMatch.address) ? "location" : "type");
    setLocationCaptured(Boolean(lookupMatch.address && isGpsAddress(lookupMatch.address)));
    setLookupMatch(null);
  };

  /** Switching away from "share location" while the field still holds an
   * unconfirmed GPS value would otherwise leave it silently saved underneath
   * the now-blanked textarea — visually empty, but still submittable as-is.
   * Clearing it here keeps what's displayed and what's actually stored in sync. */
  const switchToTypeMode = () => {
    if (isGpsAddress(form.address)) {
      setForm((f) => ({ ...f, address: "" }));
      setLocationCaptured(false);
    }
    setAddressMode("type");
  };

  const handleShareLocation = () => {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError(
        "Location isn't supported on this browser — try typing your address instead.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          address: formatGpsAddress(pos.coords.latitude, pos.coords.longitude),
        }));
        setLocationCaptured(true);
        setCaptureCount((c) => c + 1);
        setAddressError(null);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location access was blocked — allow it in your browser, or type your address instead."
            : err.code === err.TIMEOUT
              ? "Took too long to get your location — try again, or type your address instead."
              : "Couldn't get your location — try again, or type your address instead.";
        setLocationError(message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const goNext = async () => {
    if (step === "details") {
      if (!formRef.current?.reportValidity()) return;
      if (fulfillmentType === "delivery" && !form.address.trim()) {
        setAddressError("Please add a delivery address or share your location.");
        return;
      }
      setAddressError(null);
      setStep("summary");
      return;
    }

    if (step === "summary") {
      // Synchronous guard against a double-click firing two inserts with the
      // same reference before React re-renders the disabled button — state
      // updates are async and don't close that window on their own.
      if (submittingRef.current) return;
      submittingRef.current = true;
      setOrderError(null);
      setSavingOrder(true);
      try {
        await createOrder({
          reference: reference.current,
          name: form.name,
          phone: form.phone,
          email: form.email,
          ...(fulfillmentType === "delivery" ? { address: form.address } : {}),
          fulfillmentType,
          note: form.note,
          items: items.map(({ line, product }) => ({
            id: product.id,
            name: product.name,
            qty: line.qty,
            price: product.price,
          })),
          subtotal,
          deliveryFee,
          total,
        });
        setStep("payment");
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("orders_reference_key")) {
          // This reference already saved successfully in an earlier attempt
          // (e.g. the double-click this guard exists for) — the order exists,
          // so just continue rather than showing a scary duplicate-key error.
          setStep("payment");
        } else {
          setOrderError(message || "Could not save your order. Please try again.");
        }
      } finally {
        setSavingOrder(false);
        submittingRef.current = false;
      }
    }
  };

  const goBack = () => {
    if (step === "summary") setStep("details");
    else if (step === "payment") setStep("summary");
  };

  const handlePay = async () => {
    setPayError(null);
    setPaying(true);
    // Paystack requires an email even though ours is optional — fall back to a
    // synthetic, undeliverable one tied to their phone number rather than block payment.
    const payerEmail =
      form.email.trim() || `${form.phone.replace(/\D/g, "") || "guest"}@yoglait-noemail.com`;
    try {
      await payWithPaystack(
        {
          email: payerEmail,
          amount: Math.round(total * 100),
          reference: reference.current,
          channels: ["card", "mobile_money"],
          metadata: {
            custom_fields: [
              { display_name: "Customer", variable_name: "customer_name", value: form.name },
              { display_name: "Phone", variable_name: "phone", value: form.phone },
              {
                display_name: fulfillmentType === "pickup" ? "Fulfillment" : "Address",
                variable_name: fulfillmentType === "pickup" ? "fulfillment" : "address",
                value: fulfillmentType === "pickup" ? "Pickup at shop" : form.address,
              },
            ],
          },
        },
        {
          onSuccess: (ref) => {
            setPaying(false);
            setConfirmedRef(ref);
            clear();
          },
          onCancel: () => setPaying(false),
        },
      );
    } catch (err) {
      setPaying(false);
      setPayError(err instanceof Error ? err.message : "Something went wrong starting payment.");
    }
  };

  // Order confirmed — show this regardless of step.
  if (confirmedRef) {
    const waMessage = encodeURIComponent(
      fulfillmentType === "pickup"
        ? `Hi Yoglait! I just paid for order ${confirmedRef}. I'll come pick it up — please let me know when it's ready.`
        : `Hi Yoglait! I just paid for order ${confirmedRef}. Please confirm delivery to: ${form.address}`,
    );
    return (
      <section className="flex min-h-[80vh] items-center justify-center bg-hero-gradient px-5 pt-32 pb-24 sm:px-8">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="w-full max-w-md rounded-4xl bg-card p-8 text-center shadow-float"
        >
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="font-display mt-5 text-3xl font-bold">Joy, confirmed.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Payment received. Your order reference is
          </p>
          <p className="font-display mt-1 text-lg font-bold tracking-wide">{confirmedRef}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {fulfillmentType === "pickup"
              ? `We'll WhatsApp you when it's ready to collect at ${PICKUP_LOCATION}.`
              : "We'll WhatsApp you shortly to confirm delivery timing."}
          </p>
          {fulfillmentType === "pickup" && (
            <a
              href={PICKUP_MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary underline"
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Get directions
            </a>
          )}
          <a
            href={`https://wa.me/233205527771?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            Message us on WhatsApp
          </a>
          <Link
            to="/shop"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-secondary py-3 text-sm font-semibold text-secondary-foreground transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            Back to Shop
          </Link>
        </motion.div>
      </section>
    );
  }

  // Nothing to check out.
  if (items.length === 0) {
    return (
      <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-hero-gradient px-5 pt-32 pb-24 text-center sm:px-8">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60">
          <ShoppingBag className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <h1 className="font-display text-2xl font-bold">Your cart's empty</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Add a few pieces from the shop before checking out.
        </p>
        <Link
          to="/shop"
          className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          Browse Shop
        </Link>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-hero-gradient px-5 pt-32 pb-24 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Checkout</h1>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-200 ${
                  i <= stepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground"
                }`}
              >
                {i < stepIndex ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={`text-xs font-semibold ${i <= stepIndex ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <div className="relative mt-6 min-h-[420px] overflow-hidden rounded-4xl bg-card p-6 shadow-soft">
          <AnimatePresence mode="wait" initial={false}>
            {step === "details" && (
              <motion.form
                key="details"
                ref={formRef}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                onSubmit={(e) => {
                  e.preventDefault();
                  goNext();
                }}
                noValidate={false}
                className="flex flex-col gap-4"
              >
                <div>
                  <span className="mb-2 block text-xs font-semibold text-muted-foreground">
                    How would you like your order?
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType("delivery")}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold transition-colors duration-150 ${
                        fulfillmentType === "delivery"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentType("pickup")}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold transition-colors duration-150 ${
                        fulfillmentType === "pickup"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      <Store className="h-3.5 w-3.5" aria-hidden="true" />
                      Pickup
                    </button>
                  </div>
                </div>

                <Field label="Phone number">
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, phone: e.target.value }));
                      setLookupMatch(null);
                    }}
                    onBlur={handlePhoneBlur}
                    className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
                    placeholder="020 000 0000"
                  />
                </Field>

                {lookupMatch && (
                  <motion.div
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className="flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3"
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <p className="flex-1 text-xs text-foreground">
                      Welcome back, {lookupMatch.customer_name}! Use your saved details?
                    </p>
                    <button
                      type="button"
                      onClick={applyLookupMatch}
                      className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-transform duration-150 hover:scale-105 active:scale-95"
                    >
                      Use it
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLookupMatch(null);
                        setLookupDismissed(true);
                      }}
                      className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                )}

                <Field label="Full name">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
                    placeholder="Ama Owusu"
                  />
                </Field>

                {/* Visually set apart from the required fields above, so it reads as
                    skippable at a glance rather than one more field in the same list. */}
                <div className="mt-1 border-t border-dashed border-border pt-4">
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      Email
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Optional
                      </span>
                    </span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-2xl border border-dashed border-border bg-transparent px-4 py-2.5 text-sm outline-none ring-primary/40 focus:border-solid focus:ring-2"
                      placeholder="you@example.com — only if you'd like a receipt"
                    />
                  </label>
                </div>

                {fulfillmentType === "delivery" ? (
                  <div className="border-t border-border pt-4">
                    <span className="mb-2 block text-xs font-semibold text-muted-foreground">
                      Delivery address
                    </span>

                    {addressMode === "location" ? (
                      <div className="flex flex-col gap-2">
                        <div className="rounded-3xl bg-primary/10 p-4">
                          <AnimatePresence mode="wait">
                            {locating ? (
                              <motion.div
                                key="loading"
                                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18, ease: EASE_OUT }}
                                className="flex items-center gap-3"
                              >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                </span>
                                <span>
                                  <span className="block text-sm font-bold text-foreground">
                                    Getting your location…
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground">
                                    Hang tight, this only takes a second
                                  </span>
                                </span>
                              </motion.div>
                            ) : locationCaptured && isGpsAddress(form.address) ? (
                              <motion.div
                                key={`captured-${captureCount}`}
                                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25, ease: EASE_OUT }}
                                className="flex items-start gap-2.5"
                              >
                                <motion.span
                                  initial={reduce ? false : { scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.06 }}
                                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                                >
                                  <Check className="h-4 w-4" aria-hidden="true" />
                                </motion.span>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-foreground">
                                    {captureCount > 1 ? "Location re-added ✓" : "Location added ✓"}
                                  </p>
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    Please stay where you are until delivery arrives — moving around
                                    after sharing your location can cause delivery to fail.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={handleShareLocation}
                                    className="mt-2 text-[11px] font-semibold text-primary underline"
                                  >
                                    Re-share location
                                  </button>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.button
                                key="idle"
                                initial={reduce ? { opacity: 0 } : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15, ease: EASE_OUT }}
                                type="button"
                                onClick={handleShareLocation}
                                className="flex w-full items-center gap-3 text-left"
                              >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                                  <MapPin className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <span>
                                  <span className="block text-sm font-bold text-foreground">
                                    Share my location
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground">
                                    Fastest & most accurate — no typing needed
                                  </span>
                                </span>
                              </motion.button>
                            )}
                          </AnimatePresence>
                          {locationError && (
                            <p className="mt-2 text-[11px] font-medium text-destructive">
                              {locationError}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={switchToTypeMode}
                          className="self-start text-[11px] font-semibold text-muted-foreground underline"
                        >
                          Or type your address manually
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <textarea
                          autoFocus
                          value={isGpsAddress(form.address) ? "" : form.address}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, address: e.target.value }));
                            setAddressError(null);
                          }}
                          rows={2}
                          className="w-full resize-none rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
                          placeholder="House number, street, area — Accra/Tema"
                        />
                        <button
                          type="button"
                          onClick={() => setAddressMode("location")}
                          className="inline-flex items-center gap-1 self-start text-[11px] font-semibold text-primary"
                        >
                          <MapPin className="h-3 w-3" aria-hidden="true" /> Share my location
                          instead
                        </button>
                      </div>
                    )}

                    {addressError && (
                      <p className="mt-1.5 text-[11px] font-medium text-destructive">
                        {addressError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-border pt-4">
                    <span className="mb-2 block text-xs font-semibold text-muted-foreground">
                      Pickup location
                    </span>
                    <div className="flex items-start gap-3 rounded-3xl bg-primary/10 p-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Store className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-foreground">
                          {PICKUP_LOCATION}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          No address needed — we'll WhatsApp you once it's ready to collect.
                        </span>
                        <span className="mt-2 flex items-center gap-3">
                          <a
                            href={PICKUP_MAPS_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
                          >
                            <MapPin className="h-3 w-3" aria-hidden="true" /> View on Google Maps
                          </a>
                          <button
                            type="button"
                            onClick={copyPickupLink}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                          >
                            <Copy className="h-3 w-3" aria-hidden="true" /> Copy link
                          </button>
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                <Field label="Note (optional)">
                  <input
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
                    placeholder="Gate code, landmark, delivery time..."
                  />
                </Field>

                <button
                  type="submit"
                  className="mt-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  Continue to Summary
                </button>
              </motion.form>
            )}

            {step === "summary" && (
              <motion.div
                key="summary"
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="flex flex-col gap-4"
              >
                <ul className="flex flex-col gap-3">
                  {items.map(({ line, product }) => (
                    <li key={line.id} className="flex items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary/40">
                        <img
                          src={product.image}
                          alt={product.name}
                          width={768}
                          height={768}
                          loading="lazy"
                          decoding="async"
                          className="h-9 w-auto object-contain"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="truncate text-xs text-muted-foreground">
                          {categoryLabels[product.category]}
                        </span>
                        <p className="truncate text-sm font-semibold">
                          {product.name} <span className="text-muted-foreground">× {line.qty}</span>
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold">
                        GH₵ {line.qty * product.price}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>GH₵ {subtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{fulfillmentType === "pickup" ? "Pickup" : "Delivery"}</span>
                    <span>{fulfillmentType === "pickup" ? "Free" : `GH₵ ${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-foreground">
                    <span>Total</span>
                    <span>GH₵ {total}</span>
                  </div>
                </div>

                {orderError && (
                  <p className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
                    {orderError}
                  </p>
                )}

                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={savingOrder}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={savingOrder}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
                  >
                    {savingOrder && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {savingOrder ? "Saving order…" : "Continue to Payment"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div
                key="payment"
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="flex flex-col gap-4"
              >
                <div className="rounded-3xl bg-secondary/30 p-4 text-sm">
                  <p className="font-semibold">{form.name}</p>
                  <p className="text-muted-foreground">{form.phone}</p>
                  {fulfillmentType === "pickup" ? (
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Pickup at{" "}
                        {PICKUP_LOCATION}
                      </span>
                      <a
                        href={PICKUP_MAPS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        View on map
                      </a>
                    </p>
                  ) : isGpsAddress(form.address) ? (
                    <a
                      href={gpsMapsUrl(form.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline"
                    >
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Shared location
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{form.address}</p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-3xl bg-secondary/30 p-4">
                  <span className="text-sm font-semibold text-muted-foreground">Total to pay</span>
                  <span className="font-display text-2xl font-bold">GH₵ {total}</span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Pay securely by card or Mobile Money via Paystack. You'll get a confirmation once
                  it's done.
                </p>

                {payError && (
                  <p className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
                    {payError}
                  </p>
                )}

                <div className="mt-1 flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={paying}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={paying}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
                  >
                    {paying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {paying ? "Opening Paystack…" : `Pay GH₵ ${total}`}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
