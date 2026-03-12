import Link from "next/link";
import { ChevronRight, Home, Settings, FileText } from "lucide-react";
import { getSellerProfile } from "@/app/actions/seller";
import SellerProfileForm from "@/components/configuracion/SellerProfileForm";

export default async function ConfiguracionPage() {
  const seller = await getSellerProfile();

  return (
    <div className="fade-up space-y-6 max-w-2xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors">
          <Home className="w-3.5 h-3.5" />
          Inicio
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
        <span className="flex items-center gap-1 text-[var(--text-1)] font-medium">
          <Settings className="w-3.5 h-3.5" />
          Configuración
        </span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-0)] tracking-tight">
          Configuración
        </h1>
        <p className="mt-1.5 text-[var(--text-2)] text-sm">
          Ajusta tu perfil de vendedor. Esta información aparece en el encabezado de todos los PDFs generados.
        </p>
      </div>

      {/* Profile section */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[var(--border-0)]">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-[var(--text-0)] font-bold text-sm">Perfil del Vendedor</h2>
            <p className="text-[var(--text-2)] text-xs mt-0.5">
              Datos que aparecen en el encabezado de cotizaciones y facturas.
            </p>
          </div>
        </div>

        <SellerProfileForm initial={seller} />
      </div>

    </div>
  );
}
