import React from "react";
import PageHeader from "@/components/resources/PageHeader";
import WhySection from "@/components/resources/WhySection";
import SimulatorsSection from "@/components/resources/SimulatorsSection";
import CTABridge from "@/components/resources/CTABridge";
import KnowledgeHub from "@/components/resources/KnowledgeHub";

const Resources: React.FC = () => {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <PageHeader />
      <WhySection />
      <SimulatorsSection />
      <CTABridge />
      <KnowledgeHub />
      
      {/* Footer spacer */}
      <div className="h-20 bg-bg-light" />
    </main>
  );
};

export default Resources;
