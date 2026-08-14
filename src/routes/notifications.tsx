import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";

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
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 pb-32 pt-28 text-center sm:pt-40">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary">
        <Bell className="h-6 w-6 text-primary" aria-hidden="true" />
      </span>
      <h1 className="font-display mt-4 text-2xl font-bold">Notifications</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Nothing here yet — order updates and new flavour drops will show up on this page.
      </p>
    </section>
  );
}
