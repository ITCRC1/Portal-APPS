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

  const links = [
    {
      name: 'Tickets',
      url: 'https://tickets.thecostaricacollection.com/',
      description: 'Sistema de gestión y seguimiento de incidencias del hotel.',
      icon: '🛎️',
      order: 1,
    },
    {
      name: 'Vouchers',
      url: 'https://vouchers.thecostaricacollection.com/',
      description: 'Gestión y pago de tours y experiencias de los huéspedes.',
      icon: '🗺️',
      order: 2,
    },
  ]

  for (const link of links) {
    const existing = await prisma.systemLink.findFirst({
      where: { url: link.url },
    })

    if (existing) {
      await prisma.systemLink.update({
        where: { id: existing.id },
        data: link,
      })
    } else {
      await prisma.systemLink.create({ data: link })
    }
  }

  console.log('System links creados/verificados:', links.map((l) => l.name).join(', '))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
