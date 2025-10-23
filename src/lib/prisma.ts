import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

if (!process.env.PRISMA_DISABLE_PREPARED_STATEMENTS) {
  process.env.PRISMA_DISABLE_PREPARED_STATEMENTS = "true";
}
const resolvedDbUrl = process.env.DATABASE_URL;

function addPgbouncerParam(urlString: string | undefined): string | undefined {
	if (!urlString) return urlString;
	try {
		const url = new URL(urlString);
		if (!url.searchParams.has("pgbouncer")) {
			url.searchParams.set("pgbouncer", "true");
		}
		return url.toString();
	} catch {
		return urlString.includes("?") ? `${urlString}&pgbouncer=true` : `${urlString}?pgbouncer=true`;
	}
}

const prismaUrlWithPgbouncer = addPgbouncerParam(resolvedDbUrl);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
			url: prismaUrlWithPgbouncer,
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

