import { prisma } from '../api/_lib/prisma';
async function main() {
  const cats = ['Carnes','Feira','Alimentos','Guloseimas','Condimentos','Higiene','Limpeza'];
  for (const name of cats) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
