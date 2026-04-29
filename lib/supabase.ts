import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Nếu chưa config thì null — app vẫn hoạt động bình thường
export const supabase = url && key ? createClient(url, key) : null;

export interface CloudProfile {
  ho_ten: string;
  ngay_sinh: string;
  gio_sinh: string;
  gioi_tinh: string;
}

export async function saveProfileToCloud(profile: CloudProfile) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").upsert({
    id: user.id,
    ...profile,
    updated_at: new Date().toISOString(),
  });
}

export async function loadProfileFromCloud(): Promise<CloudProfile | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("ho_ten, ngay_sinh, gio_sinh, gioi_tinh")
    .eq("id", user.id)
    .single();
  return data;
}

export async function signInWithGoogle() {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/tuvi` },
  });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
