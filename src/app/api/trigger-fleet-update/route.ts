import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !projectUrl) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const edgeFunctionUrl = `${projectUrl}/functions/v1/update-fleet-status`;

  const res = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ trigger: "manual" }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json({ message: "Edge function triggered" });
} 