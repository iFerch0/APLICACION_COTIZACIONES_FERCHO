import Link from "next/link";
import { ChevronRight, Home, Users } from "lucide-react";
import { getCustomers } from "@/app/actions/customers";
import { CustomersClient } from "@/components/clientes/CustomersClient";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await getCustomers({
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
    search: params.q,
  });

  return (
    <div className="fade-up space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors">
          <Home className="w-3.5 h-3.5" />
          Inicio
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
        <span className="flex items-center gap-1 text-[var(--text-1)] font-medium">
          <Users className="w-3.5 h-3.5" />
          Clientes
        </span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-0)] tracking-tight">
          Clientes
        </h1>
        <p className="mt-1.5 text-[var(--text-2)] text-sm">
          Gestiona tu base de clientes. Los datos se utilizan en cotizaciones y facturas.
        </p>
      </div>

      <CustomersClient
        customers={result.customers}
        total={result.total}
        currentPage={params.page ? parseInt(params.page) : 1}
        limit={20}
        searchQuery={params.q ?? ""}
      />
    </div>
  );
}
