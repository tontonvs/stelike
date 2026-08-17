import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Loader2 } from "lucide-react";
import { fetchActiveNotices, type Announcement } from "@/lib/announcements";
import { fadeUp, staggerParent } from "@/lib/motion";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Yoglait" },
      {
        name: "description",
        content: "Order updates, new flavour drops and delivery alerts from Yoglait in Accra.",
      },
      { property: "og:title", content: "Notifications — Yoglait" },
      {
        property: "og:description",
        content: "Order updates and flavour drops from Yoglait.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [notices, setNotices] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchActiveNotices().then((data) => {
      if (active) setNotices(data);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col px-5 pb-32 pt-28 sm:pt-40">
      <div className="flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary">
          <Bell className="h-6 w-6 text-primary" aria-hidden="true" />
        </span>
        <h1 className="font-display mt-4 text-2xl font-bold">Notifications</h1>
      </div>

      {notices === null ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : notices.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nothing here yet — order updates and new flavour drops will show up on this page.
        </p>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={staggerParent}
          className="mt-8 flex flex-col gap-3"
        >
          {notices.map((n) => (
            <motion.li
              key={n.id}
              variants={fadeUp}
              className="rounded-3xl bg-card p-5 text-left shadow-soft"
            >
              {n.image_url && (
                <img
                  src={n.image_url}
                  alt=""
                  className="mb-3 h-32 w-full rounded-2xl object-cover"
                />
              )}
              <p className="font-display text-base font-bold">{n.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {new Date(n.created_at).toLocaleDateString("en-GH", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}
