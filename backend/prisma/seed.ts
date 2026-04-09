import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

const equipmentCategories = [
  "Jardinage",
  "Bricolage",
  "Nettoyage",
  "Électroportatif",
  "Échelles & échafaudages",
  "Automobile",
  "Déménagement",
  "Cuisine / Réception",
];

const artisanCategories = [
  "Plomberie",
  "Électricité",
  "Maçonnerie",
  "Peinture",
  "Menuiserie",
  "Paysagisme",
  "Couverture / Toiture",
  "Serrurerie",
  "Chauffage / Climatisation",
  "Nettoyage",
];

async function main() {
  console.log("Seeding categories...");
  console.log("Equipment categories:", equipmentCategories);
  console.log("Artisan categories:", artisanCategories);
  console.log("Categories are used as free-text strings in this schema.");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
