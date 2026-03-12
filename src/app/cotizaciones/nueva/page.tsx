import CotizacionForm from "@/components/cotizaciones/CotizacionForm";

export default function NuevaCotizacionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Crear Cotización</h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 border rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition font-medium shadow">
            Guardar Cotización
          </button>
        </div>
      </div>
      <p className="text-gray-600">
        Agrega los detalles del cliente y los ítems con cálculos automatizados para impuestos y envíos.
      </p>
      <CotizacionForm />
    </div>
  );
}
