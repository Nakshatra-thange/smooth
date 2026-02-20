import { PrismaClient } from '../../prisma/generated/prisma/client'

import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
const prisma = new PrismaClient({adapter});

async function run() {
  console.log("Testing DB...");

  const user = await prisma.user.create({
    data: {
      walletAddress: "TEST_WALLET_123",
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "Test Conversation",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: "Hello test",
    },
  });

  const tx = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: "TRANSFER_SOL",
      status: "PENDING",
      fromAddress: "TEST_WALLET_123",
      toAddress: "TEST_DEST",
      amount: BigInt(1000),
    },
  });

  await prisma.transaction.update({
    where: { id: tx.id },
    data: { status: "CONFIRMED" },
  });

  const result = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { conversation: true },
  });

  console.log("RESULT:", result.length);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
