import { ReadinessDashboard } from "@/components/readiness-dashboard";
import { SectionCard } from "@/components/section-card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <SectionCard title="Readiness dashboard" description="Track whether enough guardians have confirmed readiness.">
        <ReadinessDashboard />
      </SectionCard>
    </div>
  );
}
