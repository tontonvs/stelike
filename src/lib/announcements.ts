import { supabase } from "./supabase";

export type AnnouncementType = "notice" | "advert";

export type Announcement = {
  id: string;
  type: AnnouncementType;
  title: string;
  body: string;
  image_url: string | null;
  active: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
};

export type NewAnnouncementInput = {
  type: AnnouncementType;
  title: string;
  body: string;
  imageFile?: File | null;
  /** null = no expiry, stays active until a staff member turns it off. */
  durationDays: number | null;
};

/** Public: the single most recent active, non-expired announcement — shown as
 * the popup on site visit. Only one at a time keeps this simple and avoids
 * popup spam; the bell page (`fetchActiveNotices`) still lists every active
 * `notice`, so nothing is lost by only popping up the newest one. */
export async function fetchActiveAnnouncement(): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Announcement;
}

/** Public: active `notice` announcements for the bell page. `advert`
 * announcements are popup-only and deliberately excluded here — they're
 * meant to be seen once, not kept around in a list. */
export async function fetchActiveNotices(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("active", true)
    .eq("type", "notice")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Announcement[];
}

/** Staff: every announcement — active, inactive, expired — for the
 * management list in the dashboard. RLS-gated to staff. */
export async function listAnnouncementsForStaff(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Announcement[];
}

/** Staff: creates an announcement, uploading the optional image to the
 * `announcements` Storage bucket first if one was provided. */
export async function createAnnouncement(
  input: NewAnnouncementInput,
  staffId: string,
): Promise<void> {
  let imageUrl: string | null = null;

  if (input.imageFile) {
    const ext = input.imageFile.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("announcements")
      .upload(path, input.imageFile);
    if (uploadError) throw new Error(uploadError.message);
    imageUrl = supabase.storage.from("announcements").getPublicUrl(path).data.publicUrl;
  }

  const expiresAt =
    input.durationDays == null
      ? null
      : new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("announcements").insert({
    type: input.type,
    title: input.title,
    body: input.body,
    image_url: imageUrl,
    expires_at: expiresAt,
    created_by: staffId,
  });
  if (error) throw new Error(error.message);
}

/** Staff: turn an announcement on/off without deleting it — the quickest way
 * to pull a popup early or bring an old notice back. */
export async function setAnnouncementActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
