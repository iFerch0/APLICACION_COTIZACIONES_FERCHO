"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAppSetting(clave: string): Promise<string | null> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { clave } });
    return setting?.valor ?? null;
  } catch (error) {
    console.error("[getAppSetting] Error:", error);
    return null;
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.appSetting.findMany();
    return Object.fromEntries(settings.map((s) => [s.clave, s.valor]));
  } catch (error) {
    console.error("[getAllSettings] Error:", error);
    return {};
  }
}

export async function upsertSetting(
  clave: string,
  valor: string,
  descripcion?: string
) {
  try {
    await prisma.appSetting.upsert({
      where: { clave },
      update: { valor, descripcion },
      create: { clave, valor, descripcion: descripcion || "" },
    });
    revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    console.error("[upsertSetting] Error:", error);
    return { success: false, error: "Error al guardar configuración" };
  }
}
