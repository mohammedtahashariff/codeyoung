import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const mentors = await prisma.mentor.findMany({
  select: { id: true, name: true, email: true },
});
console.log(JSON.stringify(mentors, null, 2));
await prisma.$disconnect();
