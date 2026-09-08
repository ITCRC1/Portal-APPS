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

// Las 4 propiedades (hoteles / lodges) de The Costa Rica Collection. El slug es un
// identificador estable; el contenido con propertyId null es corporativo (todas).
const properties = [
  { name: 'Oxygen Jungle Villas', slug: 'oxygen-jungle-villas', icon: '🌿', order: 1 },
  { name: 'Amarena', slug: 'amarena', icon: '🌊', order: 2 },
  { name: 'Ojochal Gardens', slug: 'ojochal-gardens', icon: '🏡', order: 3 },
  { name: 'Corcovado Wilderness Lodge', slug: 'corcovado-wilderness-lodge', icon: '🌴', order: 4 },
]

async function main() {
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

  // Se preserva el nombre/ícono que el admin haya editado (solo se crean si faltan);
  // el nombre no se sobre-escribe para no pisar cambios hechos desde el panel.
  for (const p of properties) {
    await prisma.property.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    })
  }

  console.log('Propiedades creadas/verificadas:', properties.map((p) => p.name).join(', '))

  const executiveOffice = await prisma.department.findUniqueOrThrow({
    where: { slug: 'executive-office' },
  })

  // El admin inicial NUNCA lleva contraseña fija en el código (sería una brecha en un
  // repo público). Se toma de SEED_ADMIN_PASSWORD y solo se usa al CREARLO por primera
  // vez; si el admin ya existe, no se toca su contraseña.
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'it@thecostaricacollection.com').toLowerCase()
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (existingAdmin) {
    console.log('Usuario admin ya existe, no se modifica:', existingAdmin.email)
  } else {
    const seedPassword = process.env.SEED_ADMIN_PASSWORD
    if (!seedPassword || seedPassword.length < 12) {
      throw new Error(
        'Define SEED_ADMIN_PASSWORD (mínimo 12 caracteres) antes de sembrar el admin inicial. ' +
          'No existe contraseña por defecto por seguridad.'
      )
    }
    const admin = await prisma.user.create({
      data: {
        fullName: 'Administrador',
        email: adminEmail,
        passwordHash: await argon2.hash(seedPassword),
        role: 'SUPER_ADMIN',
        departmentId: executiveOffice.id,
      },
    })
    console.log('Usuario admin creado:', admin.email)
  }

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
      // Antes "Manual de Operaciones"; el contenido son SOP (Standard Operating
      // Procedures), no un manual. El upsert es por URL, así que al re-sembrar se
      // actualiza el nombre/descripción del enlace ya existente.
      name: 'Procedimientos Operativos Estándar',
      url: 'https://ops.thecostaricacollection.com/',
      description: 'Procedimientos estándar de operación (SOP) de CRC.',
      icon: '📖',
      order: 3,
    },
    {
      // App sin dominio corporativo (por ahora): sin SSO, solo enlace directo.
      name: 'Reporte Diario',
      url: 'https://frontend-daily-report-production.up.railway.app/',
      description: 'Reporte diario de operación.',
      icon: '📊',
      order: 4,
    },
    {
      // Generador de contratos y documentos laborales (RRHH), multi-propiedad.
      name: 'Gestión de RRHH',
      url: 'https://sdg-rh-management.up.railway.app/',
      description: 'Generación de contratos y documentos laborales del personal.',
      icon: '👥',
      order: 5,
    },
    {
      // Planificación financiera específica de Corcovado Wilderness Lodge.
      name: 'FinPlan CWL',
      url: 'https://finplan-cwl.up.railway.app/',
      description: 'Planificación financiera, flujo de caja y forecast de Corcovado Wilderness Lodge.',
      icon: '📈',
      order: 6,
    },
    {
      // Operación diaria (reservas, tours, logística) de Corcovado Wilderness Lodge.
      name: 'Operaciones CWL',
      url: 'https://cwl-ops.up.railway.app/',
      description: 'Reservas, tours, logística y operación diaria de Corcovado Wilderness Lodge.',
      icon: '🏨',
      order: 7,
    },
    {
      // Planificación financiera específica de Amarena.
      name: 'FinPlan Amarena',
      url: 'https://finplan-amarena.up.railway.app/',
      description: 'Planificación financiera, flujo de caja y forecast de Amarena.',
      icon: '📈',
      order: 8,
    },
    {
      // Planificación financiera específica de Oxygen Jungle Villas.
      name: 'FinPlan Oxygen',
      url: 'https://finplanoxygen.up.railway.app/',
      description: 'Planificación financiera, flujo de caja y forecast de Oxygen Jungle Villas.',
      icon: '📈',
      order: 9,
    },
    {
      // Planificación financiera específica de Ojochal Gardens.
      name: 'FinPlan Gardens',
      url: 'https://finplan-gardens.up.railway.app/',
      description: 'Planificación financiera, flujo de caja y forecast de Ojochal Gardens.',
      icon: '📈',
      order: 10,
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
