export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Bienvenido a la Plataforma Comercial</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white shadow-sm border rounded-lg hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-2">Nueva Cotización</h3>
          <p className="text-gray-600">Crea una cotización detallada con cálculos automáticos.</p>
        </div>
        <div className="p-6 bg-white shadow-sm border rounded-lg hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-2">Nueva Factura</h3>
          <p className="text-gray-600">Genera recibos y facturas simples para tus clientes.</p>
        </div>
        <div className="p-6 bg-white shadow-sm border rounded-lg hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-2">Clientes Recientes</h3>
          <p className="text-gray-600">Revisa la información de tus últimos clientes.</p>
        </div>
      </div>
    </div>
  );
}
