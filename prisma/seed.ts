import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash passwords
  const hashedPassword1 = await bcrypt.hash('password123', 10)
  const hashedPassword2 = await bcrypt.hash('password123', 10)

  // Clear existing data (optional - comment out if you want to preserve data)
  await prisma.user.deleteMany()
  await prisma.exerciseGroupCategory.deleteMany()

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword1,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword2,
    },
  })

  console.log('✅ Users created:')
  console.log(`  - ${user1.name} (${user1.email})`)
  console.log(`  - ${user2.name} (${user2.email})`)

  // Create test categories (General category is created by migration 20251118_add_default_category)
  const categories = await Promise.all([
    prisma.exerciseGroupCategory.create({
      data: {
        name: 'Upper Body',
      },
    }),
    prisma.exerciseGroupCategory.create({
      data: {
        name: 'Lower Body',
      },
    }),
    prisma.exerciseGroupCategory.create({
      data: {
        name: 'Full Body',
      },
    }),
    prisma.exerciseGroupCategory.create({
      data: {
        name: 'Conditioning',
      },
    }),
  ])

  console.log('✅ Categories created:')
  categories.forEach((cat) => {
    console.log(`  - ${cat.name} (ID: ${cat.id})`)
  })

  // Create sample exercises
  const exercises = await Promise.all([
    prisma.exercise.create({
      data: {
        name: 'Bench Press',
        description: 'Compound chest exercise',
        hasMethod: true,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Squats',
        description: 'Compound leg exercise',
        hasMethod: true,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Deadlifts',
        description: 'Compound full-body exercise',
        hasMethod: true,
      },
    }),
  ])

  console.log('✅ Exercises created:')
  exercises.forEach((ex) => {
    console.log(`  - ${ex.name} (ID: ${ex.id})`)
  })

  // Create sample methods
  const methods = await Promise.all([
    prisma.method.create({
      data: {
        name: 'Barbell',
        description: 'Using a barbell',
      },
    }),
    prisma.method.create({
      data: {
        name: 'Dumbbell',
        description: 'Using dumbbells',
      },
    }),
  ])

  console.log('✅ Methods created:')
  methods.forEach((m) => {
    console.log(`  - ${m.name} (ID: ${m.id})`)
  })

  // Create exercise groups
  const exerciseGroups = await Promise.all([
    prisma.exerciseGroup.create({
      data: {
        name: 'Chest Day',
        categoryId: categories[0].id,
        publicName: 'Treino de Peito',
      },
    }),
    prisma.exerciseGroup.create({
      data: {
        name: 'Leg Day',
        categoryId: categories[1].id,
        publicName: 'Treino de Perna',
      },
    }),
    prisma.exerciseGroup.create({
      data: {
        name: 'Back Day',
        categoryId: categories[0].id,
        publicName: 'Treino de Costas',
      },
    }),
  ])

  console.log('✅ Exercise Groups created:')
  exerciseGroups.forEach((eg) => {
    console.log(`  - ${eg.name} (ID: ${eg.id})`)
  })

  // Create exercise methods (link exercises to methods within groups)
  const exerciseMethods = await Promise.all([
    prisma.exerciseMethod.create({
      data: {
        rest: '60s',
        observations: 'Full range of motion',
        order: 1,
        exerciseGroupId: exerciseGroups[0].id,
      },
    }),
    prisma.exerciseMethod.create({
      data: {
        rest: '90s',
        observations: 'Deep squats',
        order: 1,
        exerciseGroupId: exerciseGroups[1].id,
      },
    }),
  ])

  console.log('✅ Exercise Methods created:')
  exerciseMethods.forEach((em) => {
    console.log(`  - Method ${em.id} for group ${em.exerciseGroupId}`)
  })

  // Create training sheets
  const trainingSheets = await Promise.all([
    prisma.trainingSheet.create({
      data: {
        name: 'Treino A - Peito e Tríceps',
        publicName: 'Treino A - Peito e Tríceps',
        slug: 'treino-a-peito-triceps',
      },
    }),
    prisma.trainingSheet.create({
      data: {
        name: 'Treino B - Costas e Bíceps',
        publicName: 'Treino B - Costas e Bíceps',
        slug: 'treino-b-costas-biceps',
      },
    }),
    prisma.trainingSheet.create({
      data: {
        name: 'Treino C - Pernas',
        publicName: 'Treino C - Pernas',
        slug: 'treino-c-pernas',
      },
    }),
    prisma.trainingSheet.create({
      data: {
        name: 'Treino D - Ombros e Abdômen',
        publicName: 'Treino D - Ombros e Abdômen',
        slug: 'treino-d-ombros-abdomen',
      },
    }),
  ])

  console.log('✅ Training Sheets created:')
  trainingSheets.forEach((ts) => {
    console.log(`  - ${ts.name} (ID: ${ts.id})`)
  })

  // Create training days (link training sheets to exercise groups)
  const trainingDays = await Promise.all([
    prisma.trainingDay.create({
      data: {
        day: 1,
        trainingSheetId: trainingSheets[0].id,
        exerciseGroupId: exerciseGroups[0].id,
        shortName: 'Day 1',
      },
    }),
    prisma.trainingDay.create({
      data: {
        day: 2,
        trainingSheetId: trainingSheets[0].id,
        exerciseGroupId: exerciseGroups[2].id,
        shortName: 'Day 2',
      },
    }),
    prisma.trainingDay.create({
      data: {
        day: 1,
        trainingSheetId: trainingSheets[1].id,
        exerciseGroupId: exerciseGroups[2].id,
        shortName: 'Day 1',
      },
    }),
  ])

  console.log('✅ Training Days created:')
  trainingDays.forEach((td) => {
    console.log(`  - Day ${td.day} of Training Sheet ${td.trainingSheetId}`)
  })

  console.log('\n📝 Test credentials:')
  console.log('  Email: admin@example.com')
  console.log('  Password: password123')
  console.log('  OR')
  console.log('  Email: test@example.com')
  console.log('  Password: password123')

  console.log('\n📂 Test categories created:')
  console.log('  - Upper Body')
  console.log('  - Lower Body')
  console.log('  - Full Body')
  console.log('  - Conditioning')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
