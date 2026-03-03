import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="pl-[240px] transition-all duration-300">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
