import CotizacionForm from "@/components/cotizaciones/CotizacionForm";

export default function NuevaFacturaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Emitir Factura Simple</h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 border rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition">
            Cancelar
          </button>
          {/* El botón de guardar se maneja dentro del form para reusar lógica */}
        </div>
      </div>
      <p className="text-gray-600">
        Genera una factura simple o documento equivalente a partir de los datos y cálculos de los ítems introducidos.
      </p>
      <CotizacionForm tipoDocumento="FACTURA" />
    </div>
  );
}
