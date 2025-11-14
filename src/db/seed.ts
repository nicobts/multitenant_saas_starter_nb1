import { db } from "./index";
import { tenants, users, tenantMembers, projects } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create a demo tenant
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Acme Corp",
      slug: "acme",
      plan: "pro",
      maxUsers: 50,
      maxProjects: 50,
      settings: {
        language: "en",
        timezone: "UTC",
      },
    })
    .returning();

  console.log("✅ Created tenant:", tenant.name);

  // Create demo users
  const [owner] = await db
    .insert(users)
    .values({
      name: "John Doe",
      email: "john@acme.com",
      emailVerified: true,
    })
    .returning();

  const [member] = await db
    .insert(users)
    .values({
      name: "Jane Smith",
      email: "jane@acme.com",
      emailVerified: true,
    })
    .returning();

  console.log("✅ Created users:", owner.name, member.name);

  // Add users to tenant
  await db.insert(tenantMembers).values([
    {
      tenantId: tenant.id,
      userId: owner.id,
      role: "owner",
    },
    {
      tenantId: tenant.id,
      userId: member.id,
      role: "member",
    },
  ]);

  console.log("✅ Added users to tenant");

  // Create demo projects
  await db.insert(projects).values([
    {
      tenantId: tenant.id,
      ownerId: owner.id,
      name: "Website Redesign",
      slug: "website-redesign",
      description: "Redesign the company website with modern UI/UX",
    },
    {
      tenantId: tenant.id,
      ownerId: owner.id,
      name: "Mobile App",
      slug: "mobile-app",
      description: "Build a mobile app for iOS and Android",
    },
  ]);

  console.log("✅ Created demo projects");

  console.log("🎉 Database seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
