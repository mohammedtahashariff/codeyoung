import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MENTORS = [
  { id: "m01-uuid-0001", name: "Alex Johnson", email: "alex.johnson@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
  { id: "m02-uuid-0002", name: "Priya Sharma", email: "priya.sharma@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
  { id: "m03-uuid-0003", name: "Arjun Mehta", email: "arjun.mehta@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
  { id: "m04-uuid-0004", name: "Neha Kapoor", email: "neha.kapoor@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
  { id: "m05-uuid-0005", name: "Rohan Verma", email: "rohan.verma@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
  { id: "m06-uuid-0006", name: "Ananya Rao", email: "ananya.rao@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
  { id: "m07-uuid-0007", name: "Vikram Singh", email: "vikram.singh@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
  { id: "m08-uuid-0008", name: "Meera Iyer", email: "meera.iyer@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
  { id: "m09-uuid-0009", name: "Kabir Patel", email: "kabir.patel@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
  { id: "m10-uuid-0010", name: "Ishita Das", email: "ishita.das@codeyoung.example.com", timezone: "Asia/Kolkata", active: true },
];

async function main() {
  console.log("🌱 Starting database seeding...");

  for (const mentorData of MENTORS) {
    const mentor = await prisma.mentor.upsert({
      where: { email: mentorData.email },
      update: {
        name: mentorData.name,
        timezone: mentorData.timezone,
        active: mentorData.active,
      },
      create: {
        id: mentorData.id,
        name: mentorData.name,
        email: mentorData.email,
        timezone: mentorData.timezone,
        active: mentorData.active,
      },
    });
    console.log(`✓ Seeded mentor: ${mentor.name} (${mentor.email})`);
  }

  console.log("✅ All 10 mentors seeded successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
