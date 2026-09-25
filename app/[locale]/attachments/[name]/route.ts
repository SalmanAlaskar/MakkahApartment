import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAttachmentSignedUrl } from "@/lib/storage/contract-attachments";

// Reachable without a session (partners signing via a private link need to see supporting
// documents like the title deed), but not fully public -- either an authenticated admin
// session or a valid contract sign_token is required.
export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const token = request.nextUrl.searchParams.get("token");

  const user = await getCurrentUser();
  let authorized = !!user && isAdmin(user.role);

  if (!authorized && token) {
    const supabase = await createClient();
    const { data } = await supabase.from("contract_signatures").select("id").eq("sign_token", token).single();
    authorized = !!data;
  }

  if (!authorized) return new NextResponse("Unauthorized", { status: 401 });

  const url = await getAttachmentSignedUrl(decodeURIComponent(name));
  if (!url) return new NextResponse("Not found", { status: 404 });

  return NextResponse.redirect(url);
}
