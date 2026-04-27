import { createServiceClient } from "@/lib/supabase/service";

const BUCKET = "lead-files";

export async function uploadLeadFile(
  leadId: string,
  fileBuffer: Buffer,
  filename: string,
  contentType: string,
  uploadedBy: string
): Promise<{ storagePath: string; fileId: string }> {
  const supabase = createServiceClient();
  const ext = filename.includes(".") ? filename.split(".").pop() : "";
  const storagePath = `${leadId}/${Date.now()}-${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType, upsert: false });

  if (uploadError) throw uploadError;

  const { data, error: dbError } = await supabase
    .from("lead_files")
    .insert({
      lead_id: leadId,
      filename,
      storage_path: storagePath,
      content_type: contentType,
      size_bytes: fileBuffer.length,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

  if (dbError) {
    // Clean up orphaned storage object
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw dbError;
  }

  return { storagePath, fileId: data.id };
}

export async function deleteLeadFile(fileId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: file, error: fetchError } = await supabase
    .from("lead_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (fetchError) throw fetchError;

  await supabase.storage.from(BUCKET).remove([file.storage_path]);

  const { error } = await supabase.from("lead_files").delete().eq("id", fileId);
  if (error) throw error;
}

export async function getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

export async function getLeadFiles(leadId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("lead_files")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
