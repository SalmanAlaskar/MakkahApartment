import { createClient } from "@/lib/supabase/server";

const BUCKET = "contract-attachments";

async function ensureBucket(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists/i.test(error.message)) throw error;
}

export interface AttachmentFile {
  name: string;
  size: number;
  createdAt: string | null;
}

export async function listAttachments(): Promise<AttachmentFile[]> {
  await ensureBucket();
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).list("", { sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;
  return (data ?? [])
    .filter((f) => f.id)
    .map((f) => ({ name: f.name, size: f.metadata?.size ?? 0, createdAt: f.created_at ?? null }));
}

export async function uploadAttachment(file: File): Promise<void> {
  await ensureBucket();
  const supabase = await createClient();
  const safeName = `${Date.now()}-${file.name.replace(/[^\w.\-؀-ۿ ]/g, "_")}`;
  const { error } = await supabase.storage.from(BUCKET).upload(safeName, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
}

export async function deleteAttachment(name: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([name]);
  if (error) throw error;
}

export async function getAttachmentSignedUrl(name: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(name, 300);
  if (error) return null;
  return data.signedUrl;
}
