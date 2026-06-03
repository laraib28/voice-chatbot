import { createServiceClient } from "@/lib/supabase/server";
import LeadsTable from "@/components/admin/LeadsTable";

export const dynamic = "force-dynamic";

async function deleteLead(id: string) {
  "use server";
  const supabase = createServiceClient();
  await supabase.from("leads").delete().eq("id", id);
}

export default async function LeadsPage() {
  const supabase = createServiceClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads</h1>
        <span className="text-sm text-muted-foreground">{leads?.length ?? 0} total</span>
      </div>
      <LeadsTable leads={leads ?? []} onDelete={deleteLead} />
    </div>
  );
}
