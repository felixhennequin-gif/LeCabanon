import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, MemberRole, Visibility, ActivityType } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PASSWORD = await bcrypt.hash("Test1234!", 12);

async function main() {
  console.log("🌱 Seeding LeCabanon database...\n");

  // ─── 1. Users ───────────────────────────────────────────────
  const usersData = [
    { email: "felix@lecabanon.fr", firstName: "Félix", lastName: "Hennequin" },
    { email: "jp.dumont@email.fr", firstName: "Jean-Pierre", lastName: "Dumont" },
    { email: "marie.lambert@email.fr", firstName: "Marie", lastName: "Lambert" },
    { email: "patrick.morel@email.fr", firstName: "Patrick", lastName: "Morel" },
    { email: "sophie.bertrand@email.fr", firstName: "Sophie", lastName: "Bertrand" },
    { email: "alain.petit@email.fr", firstName: "Alain", lastName: "Petit" },
    { email: "catherine.r@email.fr", firstName: "Catherine", lastName: "Rousseau" },
    { email: "nicolas.garnier@email.fr", firstName: "Nicolas", lastName: "Garnier" },
    { email: "isabelle.leroy@email.fr", firstName: "Isabelle", lastName: "Leroy" },
    { email: "thomas.bernard@email.fr", firstName: "Thomas", lastName: "Bernard" },
  ];

  const users: Record<string, { id: string }> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName },
      create: { ...u, password: PASSWORD },
    });
    users[u.email] = user;
  }
  console.log(`✅ ${usersData.length} utilisateurs`);

  // Shortcuts
  const felix = users["felix@lecabanon.fr"];
  const jp = users["jp.dumont@email.fr"];
  const marie = users["marie.lambert@email.fr"];
  const patrick = users["patrick.morel@email.fr"];
  const sophie = users["sophie.bertrand@email.fr"];
  const alain = users["alain.petit@email.fr"];
  const catherine = users["catherine.r@email.fr"];
  const nicolas = users["nicolas.garnier@email.fr"];
  const isabelle = users["isabelle.leroy@email.fr"];
  const thomas = users["thomas.bernard@email.fr"];

  // ─── 2. Communities ─────────────────────────────────────────
  const communitiesData = [
    {
      accessCode: "GUILLON24",
      name: "Avenue Guillon",
      description: "Partage de matos et bons plans artisans entre voisins de l'avenue Guillon",
      createdById: felix.id,
    },
    {
      accessCode: "BELLVUE24",
      name: "Quartier Bellevue",
      description: "Entraide et recommandations entre habitants du quartier Bellevue",
      createdById: sophie.id,
    },
    {
      accessCode: "TILLEUL24",
      name: "Résidence Les Tilleuls",
      description: "Partage entre résidents de la copropriété Les Tilleuls",
      createdById: thomas.id,
    },
  ];

  const communities: Record<string, { id: string }> = {};
  for (const c of communitiesData) {
    const community = await prisma.community.upsert({
      where: { accessCode: c.accessCode },
      update: { name: c.name, description: c.description },
      create: c,
    });
    communities[c.accessCode] = community;
  }
  console.log(`✅ ${communitiesData.length} communautés`);

  const guillon = communities["GUILLON24"];
  const bellevue = communities["BELLVUE24"];
  const tilleuls = communities["TILLEUL24"];

  // ─── 3. Members ─────────────────────────────────────────────
  const membersData: { userId: string; communityId: string; role: MemberRole }[] = [
    // Avenue Guillon
    { userId: felix.id, communityId: guillon.id, role: MemberRole.ADMIN },
    { userId: jp.id, communityId: guillon.id, role: MemberRole.MEMBER },
    { userId: marie.id, communityId: guillon.id, role: MemberRole.MEMBER },
    { userId: patrick.id, communityId: guillon.id, role: MemberRole.MEMBER },
    { userId: sophie.id, communityId: guillon.id, role: MemberRole.MEMBER },
    { userId: alain.id, communityId: guillon.id, role: MemberRole.MEMBER },
    { userId: catherine.id, communityId: guillon.id, role: MemberRole.MEMBER },
    // Quartier Bellevue
    { userId: sophie.id, communityId: bellevue.id, role: MemberRole.ADMIN },
    { userId: nicolas.id, communityId: bellevue.id, role: MemberRole.MEMBER },
    { userId: isabelle.id, communityId: bellevue.id, role: MemberRole.MEMBER },
    // Résidence Les Tilleuls
    { userId: thomas.id, communityId: tilleuls.id, role: MemberRole.ADMIN },
  ];

  let membersCount = 0;
  for (const m of membersData) {
    await prisma.communityMember.upsert({
      where: { userId_communityId: { userId: m.userId, communityId: m.communityId } },
      update: { role: m.role },
      create: m,
    });
    membersCount++;
  }
  console.log(`✅ ${membersCount} membres`);

  // ─── Clean existing data ──────────────────────────────────────
  await prisma.activity.deleteMany();
  await prisma.reviewMedia.deleteMany();
  await prisma.review.deleteMany();
  await prisma.artisan.deleteMany();
  await prisma.equipment.deleteMany();

  // ─── 4. Equipment (Avenue Guillon) ──────────────────────────
  const equipmentData = [
    { ownerId: jp.id, communityId: guillon.id, name: "Tondeuse thermique Honda", category: "Jardinage", description: "Tondeuse en bon état, réservoir plein. Fonctionne bien pour les jardins jusqu'à 200m²" },
    { ownerId: jp.id, communityId: guillon.id, name: "Taille-haie électrique Bosch", category: "Jardinage", description: "Avec rallonge de 25m incluse" },
    { ownerId: marie.id, communityId: guillon.id, name: "Perceuse visseuse Makita 18V", category: "Bricolage", description: "Deux batteries + chargeur + coffret d'embouts" },
    { ownerId: marie.id, communityId: guillon.id, name: "Scie sauteuse Bosch", category: "Électroportatif", description: "Avec 10 lames de rechange" },
    { ownerId: patrick.id, communityId: guillon.id, name: "Nettoyeur haute pression Kärcher K5", category: "Nettoyage", description: "Parfait pour terrasses, façades et voitures. Livré avec le kit mousse" },
    { ownerId: patrick.id, communityId: guillon.id, name: "Échelle télescopique 3m80", category: "Échelles & échafaudages", description: "Aluminium, supporte 150kg. Se replie compact" },
    { ownerId: patrick.id, communityId: guillon.id, name: "Bétonnière électrique 160L", category: "Bricolage", description: "Pour petits travaux de maçonnerie. Assez lourde, venir la chercher avec un véhicule" },
    { ownerId: sophie.id, communityId: guillon.id, name: "Débroussailleuse thermique Stihl", category: "Jardinage", description: "Puissante, idéale pour les terrains en friche. Essence non fournie" },
    { ownerId: sophie.id, communityId: guillon.id, name: "Ponceuse orbitale Festool", category: "Bricolage", description: "Avec système d'aspiration intégré et 20 disques grain 120" },
    { ownerId: alain.id, communityId: guillon.id, name: "Kit de plomberie complet", category: "Bricolage", description: "Clés à molette, coupe-tubes, teflon, joints divers. Pour les petits dépannages" },
    { ownerId: alain.id, communityId: guillon.id, name: "Groupe électrogène 2000W", category: "Électroportatif", description: "Pratique pour les coupures ou le bricolage extérieur loin d'une prise" },
    { ownerId: catherine.id, communityId: guillon.id, name: "Crêpière professionnelle + billig", category: "Cuisine / Réception", description: "Idéale pour les fêtes de quartier. Diamètre 40cm" },
    { ownerId: catherine.id, communityId: guillon.id, name: "Barnums pliants 3x3m (x2)", category: "Cuisine / Réception", description: "Deux barnums blancs avec parois latérales. Parfaits pour les événements en extérieur" },
    { ownerId: felix.id, communityId: guillon.id, name: "Cric hydraulique + chandelles", category: "Automobile", description: "Pour changement de roues ou petite mécanique. Supporte 2 tonnes" },
    { ownerId: felix.id, communityId: guillon.id, name: "Diable de déménagement", category: "Déménagement", description: "Charge max 200kg. Roues gonflables. Idéal pour électroménager" },
  ];

  const equipmentRecords: { id: string; name: string; ownerId: string; communityId: string }[] = [];
  for (const e of equipmentData) {
    const eq = await prisma.equipment.create({ data: e });
    equipmentRecords.push(eq);
  }
  console.log(`✅ ${equipmentRecords.length} matériels (Avenue Guillon)`);

  // ─── Equipment (Quartier Bellevue) ──────────────────────────
  const equipmentBellevueData = [
    { ownerId: nicolas.id, communityId: bellevue.id, name: "Souffleur de feuilles Stihl", category: "Jardinage", description: "Thermique, très puissant. Idéal pour l'automne" },
    { ownerId: nicolas.id, communityId: bellevue.id, name: "Poste à souder à l'arc", category: "Bricolage", description: "Avec masque et électrodes. Pour bricoleurs avertis uniquement" },
    { ownerId: isabelle.id, communityId: bellevue.id, name: "Machine à raclette 10 personnes", category: "Cuisine / Réception", description: "Parfaite pour les soirées d'hiver entre voisins" },
    { ownerId: sophie.id, communityId: bellevue.id, name: "Tronçonneuse électrique Makita", category: "Jardinage", description: "Guide 35cm, idéale pour élagage et petits abattages" },
  ];

  for (const e of equipmentBellevueData) {
    const eq = await prisma.equipment.create({ data: e });
    equipmentRecords.push(eq);
  }
  console.log(`✅ ${equipmentBellevueData.length} matériels (Quartier Bellevue)`);

  // ─── 5. Artisans (Avenue Guillon) ───────────────────────────
  const artisansGuillonData = [
    { createdById: jp.id, communityId: guillon.id, name: "Michel Dupont", company: "Dupont Plomberie", category: "Plomberie", zone: "Maisons-Laffitte et environs", phone: "06 12 34 56 78", email: "contact@dupont-plomberie.fr" },
    { createdById: marie.id, communityId: guillon.id, name: "Karim Benali", company: "KB Électricité", category: "Électricité", zone: "Yvelines Nord", phone: "06 23 45 67 89", email: "karim@kb-elec.fr" },
    { createdById: patrick.id, communityId: guillon.id, name: "Laurent Moreau", company: "Moreau & Fils", category: "Maçonnerie", zone: "Sartrouville - Maisons-Laffitte", phone: "06 34 56 78 90", email: "moreau.fils@orange.fr" },
    { createdById: sophie.id, communityId: guillon.id, name: "Émilie Blanc", company: "Blanc Peinture Déco", category: "Peinture", zone: "Maisons-Laffitte", phone: "06 45 67 89 01", email: "emilie.blanc.peinture@gmail.com" },
    { createdById: alain.id, communityId: guillon.id, name: "Pierre Lefèvre", company: "Lefèvre Menuiserie", category: "Menuiserie", zone: "Yvelines", phone: "06 56 78 90 12", email: "contact@lefevre-menuiserie.fr" },
    { createdById: catherine.id, communityId: guillon.id, name: "Yann Kervella", company: "Kervella Paysage", category: "Paysagisme", zone: "Maisons-Laffitte et alentours", phone: "06 67 89 01 23", email: "yann@kervella-paysage.fr" },
    { createdById: felix.id, communityId: guillon.id, name: "David Costa", company: "Costa Serrurerie", category: "Serrurerie", zone: "Secteur 78", phone: "06 78 90 12 34", email: "david.costa.serrurier@gmail.com" },
    { createdById: marie.id, communityId: guillon.id, name: "Stéphane Roux", company: "Roux Chauffage", category: "Chauffage / Climatisation", zone: "Yvelines Nord", phone: "06 89 01 23 45", email: "s.roux@roux-chauffage.fr" },
  ];

  // Create artisans one by one to get IDs for reviews
  const artisans: Record<string, { id: string }> = {};
  for (const a of artisansGuillonData) {
    const artisan = await prisma.artisan.create({ data: a });
    artisans[a.name] = artisan;
  }
  console.log(`✅ ${artisansGuillonData.length} artisans (Avenue Guillon)`);

  // ─── Artisans (Quartier Bellevue) ───────────────────────────
  const artisansBellevueData = [
    { createdById: nicolas.id, communityId: bellevue.id, name: "François Martin", company: "Martin Couverture", category: "Couverture / Toiture", zone: "Bellevue - Maisons-Laffitte", phone: "06 11 22 33 44", email: "f.martin.couverture@gmail.com" },
    { createdById: isabelle.id, communityId: bellevue.id, name: "Nadia Amrani", company: "Amrani Nettoyage Pro", category: "Nettoyage", zone: "Yvelines", phone: "06 22 33 44 55", email: "nadia@amrani-nettoyage.fr" },
  ];

  for (const a of artisansBellevueData) {
    const artisan = await prisma.artisan.create({ data: a });
    artisans[a.name] = artisan;
  }
  console.log(`✅ ${artisansBellevueData.length} artisans (Quartier Bellevue)`);

  // ─── 6. Reviews ─────────────────────────────────────────────
  const reviewsData = [
    // Michel Dupont (Plomberie) — 3 avis
    { artisanId: artisans["Michel Dupont"].id, authorId: felix.id, rating: 5, comment: "Intervention rapide pour une fuite sous l'évier. Propre et efficace. Tarif honnête.", visibility: Visibility.PUBLIC },
    { artisanId: artisans["Michel Dupont"].id, authorId: marie.id, rating: 4, comment: "Bon travail pour le remplacement d'un cumulus. Un peu d'attente pour le rendez-vous mais le résultat est nickel.", visibility: Visibility.PUBLIC },
    { artisanId: artisans["Michel Dupont"].id, authorId: sophie.id, rating: 5, comment: "Dépannage un samedi matin pour un WC bouché. Très réactif et sympathique.", visibility: Visibility.PUBLIC },

    // Karim Benali (Électricité) — 2 avis
    { artisanId: artisans["Karim Benali"].id, authorId: patrick.id, rating: 5, comment: "Mise aux normes du tableau électrique impeccable. Karim explique bien ce qu'il fait et pourquoi. Prix dans la moyenne.", visibility: Visibility.PUBLIC },
    { artisanId: artisans["Karim Benali"].id, authorId: alain.id, rating: 4, comment: "Installation de prises supplémentaires dans le garage. Travail soigné, câbles bien rangés.", visibility: Visibility.PUBLIC },

    // Laurent Moreau (Maçonnerie) — 2 avis
    { artisanId: artisans["Laurent Moreau"].id, authorId: jp.id, rating: 3, comment: "Bon travail sur le ravalement de la façade, par contre les délais ont été dépassés de 2 semaines. Le résultat final est correct.", visibility: Visibility.PUBLIC },
    { artisanId: artisans["Laurent Moreau"].id, authorId: catherine.id, rating: 4, comment: "Construction d'un muret de clôture. Solide et bien fini. Équipe sérieuse.", visibility: Visibility.PUBLIC },

    // Émilie Blanc (Peinture) — 2 avis
    { artisanId: artisans["Émilie Blanc"].id, authorId: marie.id, rating: 5, comment: "Je recommande vivement, Émilie a un vrai sens des couleurs. Elle a refait notre salon et chambre en 3 jours.", visibility: Visibility.PUBLIC },
    { artisanId: artisans["Émilie Blanc"].id, authorId: felix.id, rating: 5, comment: "Peinture extérieure des volets. Travail minutieux, finitions parfaites. Un peu au-dessus du marché côté tarif mais la qualité est là.", visibility: Visibility.PRIVATE },

    // Pierre Lefèvre (Menuiserie) — 1 avis
    { artisanId: artisans["Pierre Lefèvre"].id, authorId: alain.id, rating: 4, comment: "Fabrication et pose d'un portail en bois sur mesure. Beau travail artisanal. Délai respecté.", visibility: Visibility.PUBLIC },

    // Yann Kervella (Paysagisme) — 2 avis
    { artisanId: artisans["Yann Kervella"].id, authorId: patrick.id, rating: 3, comment: "Correct mais un peu cher pour ce que c'était. Le résultat est propre cependant.", visibility: Visibility.PRIVATE },
    { artisanId: artisans["Yann Kervella"].id, authorId: sophie.id, rating: 4, comment: "Taille des haies et entretien du jardin. Yann connaît bien les végétaux et donne de bons conseils.", visibility: Visibility.PUBLIC },

    // David Costa (Serrurerie) — 1 avis
    { artisanId: artisans["David Costa"].id, authorId: jp.id, rating: 5, comment: "Venu en urgence un dimanche pour une serrure bloquée. Très réactif, tarif raisonnable pour un dimanche.", visibility: Visibility.PUBLIC },

    // Stéphane Roux (Chauffage) — 2 avis
    { artisanId: artisans["Stéphane Roux"].id, authorId: catherine.id, rating: 4, comment: "Entretien annuel de la chaudière fait rapidement et proprement. Contrat d'entretien intéressant.", visibility: Visibility.PUBLIC },
    { artisanId: artisans["Stéphane Roux"].id, authorId: patrick.id, rating: 3, comment: "Installation d'une clim réversible. Ça fonctionne mais la pose des goulottes extérieures n'est pas très esthétique. À discuter avant les travaux.", visibility: Visibility.PRIVATE },

    // François Martin (Couverture — Bellevue) — 1 avis
    { artisanId: artisans["François Martin"].id, authorId: sophie.id, rating: 4, comment: "Réparation de tuiles cassées après la tempête. Intervention rapide et sérieuse.", visibility: Visibility.PUBLIC },

    // Nadia Amrani (Nettoyage — Bellevue) — 1 avis
    { artisanId: artisans["Nadia Amrani"].id, authorId: isabelle.id, rating: 5, comment: "Nettoyage complet après travaux dans l'appartement. Résultat impeccable, on aurait dit du neuf !", visibility: Visibility.PUBLIC },
  ];

  const reviewRecords: { id: string; artisanId: string; authorId: string }[] = [];
  for (const r of reviewsData) {
    const review = await prisma.review.create({ data: r });
    reviewRecords.push(review);
  }
  console.log(`✅ ${reviewRecords.length} avis`);

  // ─── 7. Activities ───────────────────────────────────────────
  // Build a timeline over the last 30 days
  const now = Date.now();
  const DAY = 86400000;
  let dayOffset = 30;

  function activityDate(): Date {
    const d = new Date(now - dayOffset * DAY + Math.random() * DAY * 0.5);
    dayOffset = Math.max(0, dayOffset - 0.5 - Math.random());
    return d;
  }

  // Helper to find artisan's communityId
  const artisanCommunity: Record<string, string> = {};
  for (const a of [...artisansGuillonData, ...artisansBellevueData]) {
    artisanCommunity[a.name] = a.communityId;
  }

  const activityData: { type: ActivityType; communityId: string; actorId: string; equipmentId?: string; artisanId?: string; reviewId?: string; createdAt: Date }[] = [];

  // Member joins (admins first as community creation, then members)
  for (const m of membersData) {
    activityData.push({ type: ActivityType.MEMBER_JOINED, communityId: m.communityId, actorId: m.userId, createdAt: activityDate() });
  }

  // Equipment additions
  for (const e of equipmentRecords) {
    activityData.push({ type: ActivityType.EQUIPMENT_ADDED, communityId: e.communityId, actorId: e.ownerId, equipmentId: e.id, createdAt: activityDate() });
  }

  // Artisan additions
  for (const [name, data] of Object.entries(artisans)) {
    const communityId = artisanCommunity[name];
    const artisanFullData = [...artisansGuillonData, ...artisansBellevueData].find((a) => a.name === name)!;
    activityData.push({ type: ActivityType.ARTISAN_ADDED, communityId, actorId: artisanFullData.createdById, artisanId: data.id, createdAt: activityDate() });
  }

  // Review additions
  for (const r of reviewRecords) {
    const artisanName = Object.entries(artisans).find(([, v]) => v.id === r.artisanId)?.[0];
    const communityId = artisanName ? artisanCommunity[artisanName] : guillon.id;
    activityData.push({ type: ActivityType.REVIEW_ADDED, communityId, actorId: r.authorId, artisanId: r.artisanId, reviewId: r.id, createdAt: activityDate() });
  }

  // Sort by date and insert
  activityData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const a of activityData) {
    await prisma.activity.create({ data: a });
  }
  console.log(`✅ ${activityData.length} activités`);

  // ─── Summary ────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.communityMember.count(),
    prisma.equipment.count(),
    prisma.artisan.count(),
    prisma.review.count(),
    prisma.activity.count(),
  ]);

  console.log("\n📊 Résumé de la base :");
  console.log(`   Utilisateurs : ${counts[0]}`);
  console.log(`   Communautés  : ${counts[1]}`);
  console.log(`   Membres      : ${counts[2]}`);
  console.log(`   Matériel     : ${counts[3]}`);
  console.log(`   Artisans     : ${counts[4]}`);
  console.log(`   Avis         : ${counts[5]}`);
  console.log(`   Activités    : ${counts[6]}`);
  console.log("\n✨ Seed terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
