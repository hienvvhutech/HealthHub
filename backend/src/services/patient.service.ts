import prisma from "../../prisma/client";

export const getPatientById = async (id: number) => {
  return await prisma.patient.findUnique({ where: { id } });
};
