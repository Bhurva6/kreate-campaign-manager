import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { polling_url } = await req.json();
    if (!polling_url) {
      return NextResponse.json({ error: "polling_url is required" }, { status: 400 });
    }
    const res = await fetch(polling_url, { method: "GET" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
} 