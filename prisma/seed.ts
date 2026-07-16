import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

// Los 9 departamentos del PRD (sección 7). El slug es la URL: /departments/<slug>.
const departments = [
  {
    name: 'Executive Office',
    slug: 'executive-office',
    description: 'Visión corporativa, desempeño de la compañía e iniciativas estratégicas.',
    icon: '🏛️',
    order: 1,
  },
  {
    name: 'Finance',
    slug: 'finance',
    description: 'Reportería financiera, cierres, control de caja, presupuesto y forecast.',
    icon: '💰',
    order: 2,
  },
  {
    name: 'Operations',
    slug: 'operations',
    description: 'Operación hotelera, experiencia del huésped, logística y ejecución diaria.',
    icon: '🛎️',
    order: 3,
  },
  {
    name: 'Sales & Marketing',
    slug: 'sales-marketing',
    description: 'Estrategia comercial, campañas, canales y generación de demanda.',
    icon: '📈',
    order: 4,
  },
  {
    name: 'Human Resources',
    slug: 'human-resources',
    description: 'Personal, contratos, onboarding, planilla y capacitación.',
    icon: '👥',
    order: 5,
  },
  {
    name: 'Procurement',
    slug: 'procurement',
    description: 'Solicitudes y órdenes de compra, proveedores, inventario y control de costos.',
    icon: '📦',
    order: 6,
  },
  {
    name: 'Maintenance / CAPEX',
    slug: 'maintenance-capex',
    description: 'Mantenimiento preventivo, órdenes de trabajo, proyectos CAPEX y activos.',
    icon: '🔧',
    order: 7,
  },
  {
    name: 'Legal / Administration',
    slug: 'legal-admin',
    description: 'Contratos, pólizas, permisos, documentos corporativos y plazos legales.',
    icon: '⚖️',
    order: 8,
  },
  {
    name: 'IT / Systems',
    slug: 'it-systems',
    description: 'Accesos, integraciones, documentación técnica y soporte interno.',
    icon: '💻',
    order: 9,
  },
]

async function main() {
  const passwordHash = await argon2.hash('CambiarEsteClave123!')

  // update deja intactos los datos que el admin haya editado desde el panel,
  // salvo la descripción/ícono base que sí conviene mantener alineados al PRD.
  for (const d of departments) {
    await prisma.department.upsert({
      where: { slug: d.slug },
      update: { name: d.name, description: d.description, icon: d.icon, order: d.order },
      create: d,
    })
  }

  console.log('Departamentos creados/verificados:', departments.length)

  const executiveOffice = await prisma.department.findUniqueOrThrow({
    where: { slug: 'executive-office' },
  })

  const user = await prisma.user.upsert({
    where: { email: 'it@thecostaricacollection.com' },
    update: {},
    create: {
      fullName: 'Administrador',
      email: 'it@thecostaricacollection.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      departmentId: executiveOffice.id,
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
    {
      name: 'Manual de Operaciones',
      url: 'https://ops.thecostaricacollection.com/',
      description: 'Manuales y procedimientos operativos de CRC.',
      icon: '📖',
      order: 3,
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
