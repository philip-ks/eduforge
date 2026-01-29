import { prisma } from "../utils/prisma";

export async function nextRequestDisplayId(): Promise<string> {
  const key = "REQUEST_SEQ";
  const counter = await prisma.counter.upsert({
    where: { key },
    update: {},
    create: { key, value: 0 },
  });

  const next = counter.value + 1;
  await prisma.counter.update({ where: { key }, data: { value: next } });

  return `REQ-${String(next).padStart(4, "0")}`;
}