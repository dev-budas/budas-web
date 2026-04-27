import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteLeadFile, getSignedUrl } from "@/lib/storage";
import { createServiceClient } from "@/lib/supabase/service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { fileId } = await params;

  try {
    await deleteLeadFile(fileId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /files/:id] delete error:", err instanceof Error ? err.name : "Unknown");
    return NextResponse.json({ error: "Error al eliminar el archivo" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { fileId } = await params;

  try {
    const supabase = createServiceClient();
    const { data: file, error } = await supabase
      .from("lead_files")
      .select("storage_path, filename, content_type")
      .eq("id", fileId)
      .single();

    if (error || !file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

    const url = await getSignedUrl(file.storage_path);
    return NextResponse.json({ url, filename: file.filename, content_type: file.content_type });
  } catch (err) {
    console.error("[API /files/:id] get error:", err instanceof Error ? err.name : "Unknown");
    return NextResponse.json({ error: "Error al obtener el archivo" }, { status: 500 });
  }
}
