import { prisma } from "../utils/prisma";

/**
 * Base Repository — Encapsulates Prisma operations.
 * All repositories extend this to get typed CRUD access.
 */
export abstract class BaseRepository {
  protected get db() {
    return prisma;
  }
}
