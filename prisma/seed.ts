import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const settings = [
    {
      clave: "amazon_rate",
      valor: "0.0225",
      descripcion: "Porcentaje garantía Amazon (2.25%)",
    },
    {
      clave: "tax_rate_us",
      valor: "0.07",
      descripcion: "Tax promedio EE.UU. (7%)",
    },
    {
      clave: "tasa_cambio_usd_cop",
      valor: "4200",
      descripcion: "Tasa de cambio USD a COP",
    },
    {
      clave: "moneda_default",
      valor: "COP",
      descripcion: "Moneda por defecto",
    },
    {
      clave: "terminos_condiciones",
      valor:
        "Cotización válida por 15 días. Precios sujetos a disponibilidad y cambio de tasa.",
      descripcion: "Términos y condiciones por defecto",
    },
  ];

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { clave: setting.clave },
      update: {},
      create: setting,
    });
  }

  console.log("✅ Seed completado");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
