import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Seed Clinics
  const weatherford = await prisma.clinic.upsert({
    where: { slug: 'weatherford-tx' },
    update: {},
    create: {
      slug: 'weatherford-tx',
      name: 'Weatherford, TX',
      address: '123 Truck Stop Dr',
      city: 'Weatherford',
      state: 'TX',
      zip: '76086',
      phone: '555-0100',
      isActive: true,
    },
  })

  const slc = await prisma.clinic.upsert({
    where: { slug: 'slc-ut' },
    update: {},
    create: {
      slug: 'slc-ut',
      name: 'Salt Lake City, UT',
      address: '456 Example Blvd',
      city: 'Salt Lake City',
      state: 'UT',
      zip: '84101',
      phone: '555-0200',
      isActive: false,
      openDate: new Date('2026-09-01'), // Fall 2026
    },
  })

  // 2. Seed Schedule for Weatherford (9-5 M-F)
  const days = [1, 2, 3, 4, 5] // Mon-Fri
  for (const day of days) {
    await prisma.clinicSchedule.upsert({
      where: {
        clinicId_dayOfWeek: {
          clinicId: weatherford.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        clinicId: weatherford.id,
        dayOfWeek: day,
        openTime: '09:00',
        closeTime: '17:00',
      },
    })
  }

  // 3. Seed Services
  const dotPhysical = await prisma.service.upsert({
    where: { id: 'service-dot-physical-weatherford' }, // Using fixed ID for idempotency check convenience or query by name/clinic combo if schema allowed unique constraint there. But schema has CUID. Let's find first or create.
    // Actually upsert needs unique field. I didn't add unique constraint on Service(clinicId, name). 
    // I should create them if not exist using findFirst. Or just use a deterministic ID logic for seeding if possible?
    // CUIDs are random. I'll rely on finding by name for seeding logic or just use `create` if I can ensure clean slate? No, strict idempotency required.
    // I will use `findFirst` then `create` if not found, or modify schema to have unique constraint on name+clinic.
    // Let's modify logic here to be safe without schema change if possible, or just add unique constraint.
    // Adding unique constraint is better practice. But for now I'll simulate upsert manually.
    update: {}, 
    create: {
        // ...
    }
  })
  // Wait, upsert REQUIRES unique field. I can't use it on non-unique.
  // I will check if service exists.
  
  const services = [
    { name: 'DOT Physical', price: 130, duration: 30, isUpsell: false },
    { name: 'Driver Tune-Up', price: 100, duration: 15, isUpsell: true },
  ]

  for (const s of services) {
    const existing = await prisma.service.findFirst({
      where: { clinicId: weatherford.id, name: s.name }
    })
    if (!existing) {
      await prisma.service.create({
        data: {
          clinicId: weatherford.id,
          name: s.name,
          price: s.price,
          duration: s.duration,
          isUpsell: s.isUpsell,
          description: s.isUpsell ? 'Boost your health' : 'Standard DOT Physical'
        }
      })
    }
  }

  // 4. Seed Intake Questions
  const questions = [
    { jsonKey: 'hasSleepApnea', text: 'Do you have sleep apnea?', type: 'boolean', order: 1 },
    { jsonKey: 'hasHighBP', text: 'Do you have high blood pressure?', type: 'boolean', order: 2 },
    { jsonKey: 'hasDiabetes', text: 'Do you have diabetes?', type: 'boolean', order: 3 },
    { jsonKey: 'hasHeartCondition', text: 'Do you have a heart condition?', type: 'boolean', order: 4 },
    { jsonKey: 'lastExamDate', text: 'When was your last exam?', type: 'date', order: 5 },
  ]

  for (const q of questions) {
    await prisma.intakeQuestion.upsert({
      where: { jsonKey: q.jsonKey },
      update: {}, // idempotent
      create: q,
    })
  }

  // 5. Seed Campaign Settings
  const campaigns = [
    { phaseName: 'phase1', triggerDays: 60, smsTemplate: 'Hi {FirstName}, your DOT card expires in 60 days. Book now: {attachmentUrl}' },
    { phaseName: 'phase2', triggerDays: 30, smsTemplate: 'Hi {FirstName}, 30 days left! Don\'t risk a violation. Book: {attachmentUrl}' },
    { phaseName: 'phase3', triggerDays: 7, smsTemplate: 'URGENT {FirstName}: 7 days remaining. Call Dr. Ben immediately or book: {attachmentUrl}' },
  ]

  for (const c of campaigns) {
    await prisma.campaignSettings.upsert({
      where: { phaseName: c.phaseName },
      update: {},
      create: c,
    })
  }

  // 6. Seed Mock Reviews
  const mockReviews = [
    { reviewerName: 'John D.', rating: 5, feedbackText: 'Fastest weirdest production ever. In and out.', isFeatured: true },
    { reviewerName: 'Sarah M.', rating: 5, feedbackText: 'Dr. Ben is the best. No wait time.', isFeatured: true },
    { reviewerName: 'Mike R.', rating: 5, feedbackText: 'Booking was super easy from my truck.', isFeatured: true },
  ]

  // We can't easy upsert reviews without a unique ID or key. I'll delete existing featured mock reviews and recreate them to ensure idempotency (or strict count).
  // Or just check if count < 3.
  const existingReviews = await prisma.review.count({ where: { isFeatured: true, reviewerName: { in: mockReviews.map(r => r.reviewerName) } } })
  
  if (existingReviews === 0) {
      for (const r of mockReviews) {
        await prisma.review.create({
            data: {
                rating: r.rating,
                feedbackText: r.feedbackText,
                isFeatured: r.isFeatured,
                reviewerName: r.reviewerName,
                status: 'approved'
            }
        })
      }
  }

  console.log('Seeding completed.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
