import { NextResponse } from "next/server";
import { MOCK_HAENDLER } from "@/lib/mock-data";

/** Stub for Phase 3 — GET /api/haendler */
export async function GET() {
  return NextResponse.json(
    MOCK_HAENDLER.map((h) => ({
      id: h.id,
      name: h.name,
      region_short: h.regionShort,
    }))
  );
}
