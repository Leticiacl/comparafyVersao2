import React from "react";

type Props = { children: React.ReactNode; className?: string };

const AppShell: React.FC<Props> = ({ children, className }) => {
  return (
    <div className="min-h-app bg-white">
      <main className={`app-container pt-safe pb-safe ${className ?? ""}`}>
        {children}
      </main>
    </div>
  );
};

export default AppShell;
