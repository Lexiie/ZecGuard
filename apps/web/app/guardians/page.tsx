import { GuardianSetupForm } from "@/components/guardian-setup-form";
import { SectionCard } from "@/components/section-card";

export default function GuardiansPage() {
  return (
    <div className="space-y-6">
      <SectionCard title="Guardian setup" description="Configure a 2-of-3 guardian set for the MVP demo.">
        <GuardianSetupForm />
      </SectionCard>
    </div>
  );
}
