import prisma from "../../prisma/client";

export const createUser = async (
  email: string,
  password: string,
  role: string = "patient"
) => {
  return await prisma.user.create({
    data: {
      email,
      password,
      role,
    },
  });
};
