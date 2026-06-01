// "use client";
// // Toggle dashboard dev mode via environment variable to bypass auth redirects locally
// const DEV_MODE = process.env.NEXT_PUBLIC_DASHBOARD_DEV_MODE === "true";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/hooks/useAuth";
// import { Header } from "@/components/Header";
// import { TabNavigation } from "@/components/TabNavigation";
// import { DashboardVisuals } from "@/components/dashboard-visuals";
// import PaymentTracking from "@/components/PaymentTracking";
// import { AdminPanel } from "@/components/admin/AdminPanel";
// import { CompaniesList } from "@/components/CompaniesList";

// export default function DashboardPage() {
//   const router = useRouter();
//   const { user, loading: authLoading } = useAuth();
//   const [activeTab, setActiveTab] = useState("owner");

//   useEffect(() => {
//     if (DEV_MODE) return;
//     if (!authLoading && !user) {
//       router.replace("/login");
//     }
//   }, [user, authLoading, router]);

//   if (!DEV_MODE && (authLoading || !user)) {
//     return (
//       <div className="flex min-h-screen items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
//           <p className="mt-4 text-muted-foreground">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header />
//       <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

//       <main className="container mx-auto px-6 py-6">
//         {/* Visually hidden h1 for accessibility/semantic HTML */}
//         <h1 className="sr-only">NSJ Analytics Dashboard</h1>

//         {/* Test Component - Displaying companies from backend */}
//         <div className="mb-6">
//           <CompaniesList />
//         </div>

//         {activeTab === "owner" && (
//           <div key={activeTab}>
//             <DashboardVisuals />
//           </div>
//         )}
//         {activeTab === "payment" && (
//           <div key={activeTab}>
//             <PaymentTracking />
//           </div>
//         )}
//         {activeTab === "admin" && <AdminPanel key={activeTab} />}
//       </main>
//     </div>
//   );
// }
// app/dashboard/page.tsx
// app/dashboard/page.tsx
// app/dashboard/page.tsx
import { DashboardShell } from "@/components/DashboardShell";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardShell />
    </div>
  );
}
