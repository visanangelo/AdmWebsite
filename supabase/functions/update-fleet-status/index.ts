/// <reference types="deno.ns" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (_req: any) => {
  const { data: fleet } = await supabase.from("fleet").select("*");
  const { data: requests } = await supabase.from("rental_requests").select("*");
  // Revert to real current date
  const today = new Date().toISOString().slice(0, 10);

  // Mark expired approved rentals as Completed
  for (const req of requests || []) {
    if (req.status === "Approved" && req.end_date < today) {
      await supabase.from("rental_requests").update({ status: "Completed" }).eq("id", req.id);
    }
  }

  for (const vehicle of fleet || []) {
    // 1. If vehicle is in Maintenance, do not auto-update
    if (vehicle.status === "Maintenance") continue;

    // 2. Only consider approved rentals for this vehicle
    const approvedRentals = (requests || []).filter((r: any) =>
      r.equipment_id === vehicle.id &&
      r.status === "Approved"
    );

    // 3. Check for 'In Use' (today is within any rental period)
    const inUse = approvedRentals.some((r: any) => r.start_date <= today && r.end_date >= today);
    // 4. Check for 'Reserved' (future rental exists, but not today)
    const reserved = !inUse && approvedRentals.some((r: any) => r.start_date > today);

    let newStatus = "Available";
    if (inUse) {
      newStatus = "In Use";
    } else if (reserved) {
      newStatus = "Reserved";
    }
    // 5. Only update if status changed
    if (vehicle.status !== newStatus) {
      await supabase.from("fleet").update({ status: newStatus }).eq("id", vehicle.id);
    }
  }

  return new Response("Fleet status updated", { status: 200 });
});