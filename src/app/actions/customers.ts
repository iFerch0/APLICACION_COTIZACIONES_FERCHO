"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { customerSchema } from "@/lib/schemas";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CustomerRow = {
  id: string;
  nombres: string;
  apellidos: string | null;
  direccion: string | null;
  celular: string | null;
  email: string | null;
  identificacion: string | null;
  notas: string | null;
  createdAt: Date;
  _count: { documents: number };
};

export type CustomerDetail = CustomerRow & {
  documents: {
    id: string;
    numero: string;
    tipo: string;
    estado: string;
    fecha: Date;
    totalFinal: number;
  }[];
};

// ── Create ────────────────────────────────────────────────────────────────────

export async function createCustomer(data: unknown) {
  try {
    const validated = customerSchema.parse(data);

    const customer = await prisma.customer.create({
      data: {
        nombres: validated.nombres,
        apellidos: validated.apellidos || null,
        direccion: validated.direccion || null,
        celular: validated.celular || null,
        email: validated.email || null,
        identificacion: validated.identificacion || null,
        notas: validated.notas || null,
      },
    });

    revalidatePath("/clientes");

    return customer;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Datos inválidos: ${error.issues.map((i) => i.message).join(", ")}`);
    }
    console.error("[createCustomer] Error:", error);
    throw new Error("Error al crear el cliente.");
  }
}

// ── Search (autocomplete) ─────────────────────────────────────────────────────

export async function searchCustomers(query: string) {
  if (!query) return [];
  return await prisma.customer.findMany({
    where: {
      OR: [
        { nombres: { contains: query } },
        { apellidos: { contains: query } },
        { email: { contains: query } },
        { identificacion: { contains: query } },
      ],
    },
    take: 5,
  });
}

// ── List with pagination ──────────────────────────────────────────────────────

export async function getCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ success: boolean; customers: CustomerRow[]; total: number }> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const search = params?.search?.trim() ?? "";

    const where = search
      ? {
          OR: [
            { nombres: { contains: search } },
            { apellidos: { contains: search } },
            { email: { contains: search } },
            { identificacion: { contains: search } },
            { celular: { contains: search } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          direccion: true,
          celular: true,
          email: true,
          identificacion: true,
          notas: true,
          createdAt: true,
          _count: { select: { documents: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { success: true, customers, total };
  } catch (error) {
    console.error("[getCustomers] Error:", error);
    return { success: false, customers: [], total: 0 };
  }
}

// ── Get by ID ─────────────────────────────────────────────────────────────────

export async function getCustomerById(
  id: string
): Promise<{ success: boolean; customer?: CustomerDetail }> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        direccion: true,
        celular: true,
        email: true,
        identificacion: true,
        notas: true,
        createdAt: true,
        _count: { select: { documents: true } },
        documents: {
          select: {
            id: true,
            numero: true,
            tipo: true,
            estado: true,
            fecha: true,
            totalFinal: true,
          },
          orderBy: { fecha: "desc" },
          take: 20,
        },
      },
    });

    if (!customer) {
      return { success: false };
    }

    return { success: true, customer };
  } catch (error) {
    console.error("[getCustomerById] Error:", error);
    return { success: false };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateCustomer(
  id: string,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = customerSchema.parse(data);

    await prisma.customer.update({
      where: { id },
      data: {
        nombres: validated.nombres,
        apellidos: validated.apellidos || null,
        direccion: validated.direccion || null,
        celular: validated.celular || null,
        email: validated.email || null,
        identificacion: validated.identificacion || null,
        notas: validated.notas || null,
      },
    });

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((i) => i.message).join(", "),
      };
    }
    console.error("[updateCustomer] Error:", error);
    return { success: false, error: "Error al actualizar el cliente." };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCustomer(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar que no tenga documentos asociados
    const docCount = await prisma.commercialDocument.count({
      where: { customerId: id },
    });

    if (docCount > 0) {
      return {
        success: false,
        error: "No se puede eliminar: el cliente tiene documentos asociados.",
      };
    }

    await prisma.customer.delete({ where: { id } });

    revalidatePath("/clientes");

    return { success: true };
  } catch (error) {
    console.error("[deleteCustomer] Error:", error);
    return { success: false, error: "Error al eliminar el cliente." };
  }
}
