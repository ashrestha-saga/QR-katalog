import { NextResponse } from "next/server";
import { buildTargetUrl } from "@/lib/mock-data";

/** Stub for Phase 5 — POST /api/select (Händler routing, currently dormant) */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const haendler = body.haendler as string | undefined;
  const productId = body.product_id as string | undefined;
  const remember = Boolean(body.remember);

  if (!haendler || !productId) {
    return NextResponse.json(
      { error: "haendler and product_id required" },
      { status: 400 }
    );
  }

  const redirect_url = buildTargetUrl(haendler, productId);
  const response = NextResponse.json({ redirect_url, _prototype: true });

  if (remember) {
    const maxAge = 90 * 24 * 60 * 60;
    response.cookies.set("mz_haendler", haendler, {
      maxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
