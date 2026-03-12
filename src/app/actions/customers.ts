"use server";

import prisma from "@/lib/prisma";

export async function createCustomer(data: { nombres: string; email?: string; notas?: string }) {
  return await prisma.customer.create({
    data: {
      nombres: data.nombres,
      email: data.email,
      notas: data.notas,
    },
  });
}

export async function searchCustomers(query: string) {
  if (!query) return [];
  return await prisma.customer.findMany({
    where: {
      OR: [
        { nombres: { contains: query } },
        { email: { contains: query } },
      ],
    },
    take: 5,
  });
}
