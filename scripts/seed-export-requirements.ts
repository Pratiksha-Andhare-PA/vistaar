import "dotenv/config";
import { prisma } from "../lib/database";
import { EXPORT_REQUIREMENTS } from "../lib/export-readiness/requirements";

async function main() {
  console.log(
    `Seeding ${EXPORT_REQUIREMENTS.length} export requirements...`,
  );

  let created = 0;
  let updated = 0;

  for (const requirement of EXPORT_REQUIREMENTS) {
    const { id, ...data } = requirement;

    const existing = await prisma.exportRequirement.findUnique({
      where: { id },
      select: { id: true },
    });

    await prisma.exportRequirement.upsert({
      where: { id },
      create: {
        id,
        ...data,
        sourceCheckedAt: new Date("2026-11-17T00:00:00.000Z"),
      },
      update: {
        ...data,
        sourceCheckedAt: new Date("2026-11-17T00:00:00.000Z"),
      },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  console.log("Export requirements seeded successfully.");
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Total: ${EXPORT_REQUIREMENTS.length}`);
}

main()
  .catch((error) => {
    console.error("Export requirements seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
