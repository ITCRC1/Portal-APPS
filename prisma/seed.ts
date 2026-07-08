import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await argon2.hash('CambiarEsteClave123!')

  const department = await prisma.department.upsert({
    where: { slug: 'executive-office' },
    update: {},
    create: {
      name: 'Executive Office',
      slug: 'executive-office',
      description: 'Oficina ejecutiva',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'it@thecostaricacollection.com' },
    update: {},
    create: {
      fullName: 'Administrador',
      email: 'it@thecostaricacollection.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      departmentId: department.id,
    },
  })

  console.log('Usuario creado:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })