import { Prisma } from "@prisma/client";

export const serializableTransaction = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

export function isFinanceConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2034" || error.code === "P2002");
}
