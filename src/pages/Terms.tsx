import React from "react";
import PageHeader from "../components/ui/PageHeader";
import BottomNav from "../components/BottomNav";
import TermsBody from "@/components/ui/TermsBody";

const Terms: React.FC = () => {
  return (
    <main className="min-h-screen w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
      <div className="mx-auto w-full
        max-w-[420px] sm:max-w-[480px] md:max-w-[560px]
        lg:max-w-[640px] xl:max-w-[720px] 2xl:max-w-[820px] pb-28">
        <PageHeader title="Termos de Uso" />
        <div className="mt-3">
          <TermsBody />
        </div>
        <BottomNav activeTab="profile" />
      </div>
    </main>
  );
};

export default Terms;
