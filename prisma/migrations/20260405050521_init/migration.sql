-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "profesion" TEXT,
    "direccion" TEXT,
    "celular" TEXT,
    "email" TEXT,
    "identificacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT,
    "direccion" TEXT,
    "celular" TEXT,
    "email" TEXT,
    "identificacion" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialDocument" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sellerId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "observaciones" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "totalTax" DECIMAL(12,2) NOT NULL,
    "totalEnvio" DECIMAL(12,2) NOT NULL,
    "totalPromocionEnvio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmazon" DECIMAL(12,2) NOT NULL,
    "totalImportacion" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total4x1000" DECIMAL(12,2) NOT NULL,
    "totalFinal" DECIMAL(12,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "cotizacionOrigenId" TEXT,
    "margenPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "margenTipo" TEXT NOT NULL DEFAULT 'base',
    "margenRedondeo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialDocumentItem" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitarioBase" DECIMAL(12,2) NOT NULL,
    "tipoItem" TEXT NOT NULL DEFAULT 'PRODUCTO',
    "fuenteCompra" TEXT NOT NULL DEFAULT 'LOCAL',
    "precioOriginal" DECIMAL(12,4),
    "monedaOriginal" TEXT DEFAULT 'COP',
    "grupoId" TEXT,
    "grupoLabel" TEXT,
    "aplicaTax" BOOLEAN NOT NULL DEFAULT false,
    "taxUnitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "envioUnitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "promocionEnvioUnitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "importacionUnitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "aplicaAmazon" BOOLEAN NOT NULL DEFAULT false,
    "amazonUnitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoUnitarioFinal" DECIMAL(12,2) NOT NULL,
    "subtotalLinea" DECIMAL(12,2) NOT NULL,
    "aplica4x1000" BOOLEAN NOT NULL DEFAULT false,
    "valor4x1000Linea" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "CommercialDocumentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "secuencia" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommercialDocument_numero_key" ON "CommercialDocument"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_clave_key" ON "AppSetting"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_tipo_key" ON "DocumentSequence"("tipo");

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_cotizacionOrigenId_fkey" FOREIGN KEY ("cotizacionOrigenId") REFERENCES "CommercialDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocumentItem" ADD CONSTRAINT "CommercialDocumentItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CommercialDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
