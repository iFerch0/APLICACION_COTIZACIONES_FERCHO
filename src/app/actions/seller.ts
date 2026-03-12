"use server";

import prisma from "@/lib/prisma";

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

export async function upsertSellerProfile(data: {
  nombre: string;
  profesion?: string;
  direccion?: string;
  celular?: string;
  email?: string;
  identificacion?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await prisma.sellerProfile.findFirst();
    if (existing) {
      await prisma.sellerProfile.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.sellerProfile.create({ data });
    }
    return { success: true };
  } catch {
    return { success: false, error: "Error al guardar el perfil." };
  }
}
