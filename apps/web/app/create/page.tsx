import { CreatePlanForm } from "@/components/create-plan-form";
import { PrototypeWarning } from "@/components/prototype-warning";
import { SectionCard } from "@/components/section-card";

export default function CreatePage() {
  return (
    <div className="space-y-6">
      <PrototypeWarning />
      <SectionCard title="Create recovery plan" description="Capture only the context guardians need for a future recovery ceremony.">
        <CreatePlanForm />
      </SectionCard>
    </div>
  );
}
