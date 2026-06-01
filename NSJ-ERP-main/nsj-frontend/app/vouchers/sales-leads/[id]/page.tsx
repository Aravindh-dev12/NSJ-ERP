// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardFooter,
// } from "@/components/ui/card";
// import { vouchersAggregates, vouchersList, type Voucher } from "@/lib/backend";

// export default function VouchersOverviewPage() {
//   const [loading, setLoading] = useState(true);
//   const [aggregates, setAggregates] = useState<{
//     total?: number;
//     with_advance?: number;
//     recent_7_days?: number;
//   }>({});

//   useEffect(() => {
//     let mounted = true;
//     setLoading(true);
//     void vouchersAggregates()
//       .then((data) => {
//         if (mounted) setAggregates(data ?? {});
//       })
//       .catch(() => {
//         if (mounted) setAggregates({});
//       })
//       .finally(() => {
//         if (mounted) setLoading(false);
//       });
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   // fetch recent vouchers
//   const [recent, setRecent] = useState<Voucher[]>([]);
//   useEffect(() => {
//     let mounted = true;
//     void (async () => {
//       try {
//         const resp = await vouchersList({ page: 1, page_size: 5 });
//         if (!mounted) return;
//         setRecent(resp.results ?? []);
//       } catch {
//         if (!mounted) return;
//         setRecent([]);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, []);
//   return (
//     <div className="space-y-8">
//       <VouchersHeader
//         title="Orders overview"
//         description="Monitor order health at a glance and jump into detailed order management."
//       />

//       <section className="grid gap-6 lg:grid-cols-3">
//         <Card>
//           <CardHeader>
//             <CardTitle>Total orders</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-semibold">
//               {loading ? "—" : (aggregates.total ?? "—")}
//             </div>
//             <p className="text-sm text-muted-foreground">
//               All vouchers recorded in NSJ.
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Advance paid</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-semibold  text-emerald-600">
//               {loading ? "—" : (aggregates.with_advance ?? "—")}
//             </div>
//             <p className="text-sm text-muted-foreground">
//               Orders with an advance payment recorded.
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Recent (7d)</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-semibold  text-amber-600">
//               {loading ? "—" : (aggregates.recent_7_days ?? "—")}
//             </div>
//             <p className="text-sm text-muted-foreground">
//               Vouchers created in the last 7 days.
//             </p>
//           </CardContent>
//         </Card>
//       </section>

//       <Card className="bg-background">
//         <CardHeader>
//           <CardTitle>Recent orders</CardTitle>
//           <CardDescription>Latest orders added to the system.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           {recent.length === 0 ? (
//             <p className="text-sm text-muted-foreground">
//               No orders available yet. Create one to get started.
//             </p>
//           ) : (
//             <ul className="divide-y divide-border">
//               {recent.map((v) => (
//                 <li
//                   key={v.id}
//                   className="flex items-center justify-between py-3"
//                 >
//                   <div>
//                     <p className="text-sm font-medium text-foreground">
//                       {v.bill_no ?? "Unnamed"}
//                     </p>
//                     <p className="text-xs text-muted-foreground">
//                       {v.item_name ?? "—"}
//                     </p>
//                   </div>
//                   <span className="text-xs font-semibold text-primary">
//                     {v.account && typeof v.account === "object"
//                       ? (((v.account as Record<string, unknown>)
//                           .account_name as string) ??
//                         ((v.account as Record<string, unknown>)
//                           .name as string) ??
//                         "")
//                       : typeof v.account === "string"
//                         ? v.account
//                         : ""}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </CardContent>
//         <CardFooter className="justify-end">
//           <Link href="/vouchers/list" className="text-sm text-primary">
//             See all orders
//           </Link>
//         </CardFooter>
//       </Card>
//     </div>
//   );
// }

import { SalesLeadsForm } from "@/components/vouchers/SalesLeadsForm";

export default async function SalesQueryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SalesLeadsForm queryId={id} />;
}
