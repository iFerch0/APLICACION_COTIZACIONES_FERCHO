"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { sellerProfileSchema } from "@/lib/schemas";
import { z } from "zod";

export type SellerData = {
  id: string;
  nombre: string;
  profesion: string | null;
  direccion: string | null;
  celular: string | null;
  email: string | null;
  identificacion: string | null;
};

export async function getSellerProfile(): Promise<SellerData | null> {
  return await prisma.sellerProfile.findFirst({
    select: {
      id: true,
      nombre: true,
      profesion: true,
      direccion: true,
      celular: true,
      email: true,
      identificacion: true,
    },
  });
}

export async function upsertSellerProfile(
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = sellerProfileSchema.parse(data);

    const existing = await prisma.sellerProfile.findFirst();
    if (existing) {
      await prisma.sellerProfile.update({
        where: { id: existing.id },
        data: {
          nombre: validated.nombre,
          profesion: validated.profesion || null,
          direccion: validated.direccion || null,
          celular: validated.celular || null,
          email: validated.email || null,
          identificacion: validated.identificacion || null,
        },
      });
    } else {
      await prisma.sellerProfile.create({
        data: {
          nombre: validated.nombre,
          profesion: validated.profesion || null,
          direccion: validated.direccion || null,
          celular: validated.celular || null,
          email: validated.email || null,
          identificacion: validated.identificacion || null,
        },
      });
    }

    revalidatePath("/configuracion");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Datos inválidos: ${error.issues.map((i) => i.message).join(", ")}`,
      };
    }
    console.error("[upsertSellerProfile] Error:", error);
    return { success: false, error: "Error al guardar el perfil." };
  }
}
