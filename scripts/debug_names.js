
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const products = await p.product.findMany({ where: { isActive: true }, take: 5 });
  products.forEach(pr => {
    // Output hex dump of name
    const hex = Buffer.from(pr.name, "utf8").toString("hex");
    process.stdout.write("ID: " + pr.id + " | hex: " + hex.slice(0, 40) + "... | len:" + pr.name.length + "\n");
  });
  await p.$disconnect();
}
main();
