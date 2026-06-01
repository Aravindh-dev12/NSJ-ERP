// "use client";

// import { useEffect, useState } from "react";

// interface Company {
//   id: string;
//   name: string;
//   display_name: string;
//   is_active: boolean;
//   created_at: string;
// }

// export function CompaniesList() {
//   const [companies, setCompanies] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchCompanies = async () => {
//       try {
//         const response = await fetch("http://localhost:8000/api/companies/");
//         if (!response.ok) {
//           throw new Error("Failed to fetch companies");
//         }
//         const data = await response.json();
//         setCompanies(data);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "An error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCompanies();
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <div className="text-center">
//           <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
//           <p className="mt-4 text-gray-600">Loading companies...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="rounded-lg bg-red-50 p-6 border border-red-200">
//         <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
//         <p className="text-red-600">{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
//       <h2 className="text-2xl font-bold text-gray-900 mb-4">
//         Companies from NSJ Backend
//       </h2>
//       {companies.length === 0 ? (
//         <p className="text-gray-600">No companies found.</p>
//       ) : (
//         <div className="space-y-3">
//           {companies.map((company) => (
//             <div
//               key={company.id}
//               className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
//             >
//               <div>
//                 <h3 className="font-semibold text-gray-900">{company.name}</h3>
//                 <p className="text-sm text-gray-600">{company.display_name}</p>
//               </div>
//               <div className="flex items-center space-x-3">
//                 <span
//                   className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                     company.is_active
//                       ? "bg-green-100 text-green-800"
//                       : "bg-gray-100 text-gray-800"
//                   }`}
//                 >
//                   {company.is_active ? "Active" : "Inactive"}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// components/CompaniesList.tsx
"use client";
import { useEffect, useState } from "react";
import { backend, Company } from "@/lib/backend";

export default function CompaniesList() {
  const [rows, setRows] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await backend.companiesList();
        setRows(data);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to fetch companies");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading companies…</p>;
  if (err) return <p style={{ color: "red" }}>{err}</p>;
  if (!rows.length) return <p>No companies found.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
            <th className="px-4 py-3 font-semibold text-gray-700">
              Display Name
            </th>
            <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Created</th>
            <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="px-4 py-3">{c.name}</td>
              <td className="px-4 py-3">{c.display_name ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3">
                {new Date(c.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-gray-500">{c.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
