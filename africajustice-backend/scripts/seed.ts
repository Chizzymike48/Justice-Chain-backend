import mongoose from 'mongoose'
import { Report } from '../src/models/Report'
import { Evidence } from '../src/models/Evidence'
import { Verification } from '../src/models/Verification'
import { Project } from '../src/models/Project'
import { Petition } from '../src/models/Petition'

/**
 * Seed database with sample data for testing and demo
 * Usage: npx ts-node scripts/seed.ts
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/africajustice'

const sampleReports = [
  {
    title: 'Unauthorized Fund Transfer at Ministry',
    description: 'Discovery of unauthorized transfer of government funds totaling $500,000 from the Health Ministry budget to unknown accounts.',
    category: 'embezzlement',
    status: 'investigating',
    office: 'Ministry of Health',
    amount: 500000,
    source: 'Internal audit',
  },
  {
    title: 'Procurement Fraud in Construction Contract',
    description: 'Evidence of bid rigging and over-invoicing in a major infrastructure project awarded by the Roads Authority.',
    category: 'fraud',
    status: 'pending',
    office: 'Roads Authority',
    amount: 2000000,
    source: 'Whistleblower',
  },
  {
    title: 'Bribery in License Approval Process',
    description: 'Multiple reports of officers demanding bribes for business license approvals in the private sector regulatory body.',
    category: 'corruption',
    status: 'open',
    office: 'Business Licensing Bureau',
    source: 'Multiple sources',
  },
  {
    title: 'Ghost Employees on Payroll',
    description: 'Investigation into non-existent employees receiving salaries at the Water Authority for the past 2 years.',
    category: 'embezzlement',
    status: 'investigating',
    office: 'Water Authority',
    amount: 150000,
    source: 'Financial audit',
  },
  {
    title: 'Nepotism in Government Appointments',
    description: 'Systematic appointment of family members to senior positions despite lack of qualifications.',
    category: 'corruption',
    status: 'pending',
    office: 'Civil Service Commission',
    source: 'Public records analysis',
  },
]

const sampleProjects = [
  {
    title: 'KMS Highway Expansion',
    description: 'Major infrastructure project for highway expansion',
    budget: 50000000,
    status: 'on_track',
    agency: 'Roads Authority',
    location: 'Central District',
    progress: 65,
  },
  {
    title: 'Rural Health Centers Program',
    description: 'Construction of 50 health centers in rural areas',
    budget: 25000000,
    status: 'at_risk',
    agency: 'Ministry of Health',
    location: 'Northern Region',
    progress: 35,
  },
  {
    title: 'Water Supply Infrastructure',
    description: 'New water treatment plant and distribution pipes',
    budget: 75000000,
    status: 'on_track',
    agency: 'Water Authority',
    location: 'Western District',
    progress: 50,
  },
  {
    title: 'Education Technology Initiative',
    description: 'Digital infrastructure for schools',
    budget: 15000000,
    status: 'delayed',
    agency: 'Ministry of Education',
    location: 'Southern Province',
    progress: 20,
  },
]

const samplePetitions = [
  {
    title: 'Investigate Irregular Contracts at Ministry',
    description: 'We demand a full investigation into the awarding of contracts without proper tender procedures.',
    supporters: 1250,
    status: 'active',
  },
  {
    title: 'Transparency in Government Procurement',
    description: 'Push for mandatory disclosure of all government procurement decisions and beneficiaries.',
    supporters: 3450,
    status: 'active',
  },
  {
    title: 'Accountability for Past Corruption Cases',
    description: 'Demand prosecution of individuals involved in historical corruption scandals.',
    supporters: 2100,
    status: 'closed',
  },
]

const sampleVerifications = [
  {
    claim: 'The contract was awarded without competitive bidding',
    source: 'Government gazette review',
    confidence: 85,
    status: 'reviewed',
  },
  {
    claim: 'Multiple bids were submitted but winner was predetermined',
    source: 'Anonymous whistleblower',
    confidence: 60,
    status: 'pending',
  },
  {
    claim: 'Final project cost exceeded approved budget by 40%',
    source: 'Public financial records',
    confidence: 95,
    status: 'reviewed',
  },
]

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...')

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await Report.deleteMany({})
    await Evidence.deleteMany({})
    await Verification.deleteMany({})
    await Project.deleteMany({})
    await Petition.deleteMany({})

    // Seed Reports
    console.log('📝 Seeding reports...')
    const reports = await Report.insertMany(sampleReports)
    console.log(`✅ Created ${reports.length} sample reports`)

    // Seed Projects
    console.log('🏗️  Seeding projects...')
    const projects = await Project.insertMany(sampleProjects)
    console.log(`✅ Created ${projects.length} sample projects`)

    // Seed Petitions
    console.log('✍️  Seeding petitions...')
    const petitions = await Petition.insertMany(samplePetitions)
    console.log(`✅ Created ${petitions.length} sample petitions`)

    // Seed Verifications
    console.log('🔍 Seeding verifications...')
    if (sampleVerifications.length > 0) {
      const verifications = await Verification.insertMany(sampleVerifications)
      console.log(`✅ Created ${verifications.length} sample verifications`)
    }

    // Seed Evidence (linked to reports)
    console.log('📎 Seeding evidence...')
    if (reports.length > 0) {
      const evidenceData = [
        {
          caseId: reports[0]._id,
          fileName: 'bank_transfer_receipt.pdf',
          status: 'uploaded',
          fileSize: 245000,
          mimeType: 'application/pdf',
        },
        {
          caseId: reports[1]._id,
          fileName: 'bid_documents.zip',
          status: 'uploaded',
          fileSize: 5000000,
          mimeType: 'application/zip',
        },
        {
          caseId: reports[2]._id,
          fileName: 'witness_statement.docx',
          status: 'uploaded',
          fileSize: 150000,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      ]
      const evidence = await Evidence.insertMany(evidenceData)
      console.log(`✅ Created ${evidence.length} sample evidence files`)
    }

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - ${reports.length} reports`)
    console.log(`   - ${projects.length} projects`)
    console.log(`   - ${petitions.length} petitions`)
    console.log(`   - ${sampleVerifications.length} verifications`)
    console.log(`   - 3 evidence files`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

seedDatabase()
