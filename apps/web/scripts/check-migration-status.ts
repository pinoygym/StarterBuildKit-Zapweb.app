import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Env DATABASE_URL:', process.env.DATABASE_URL ? 'IS SET' : 'NOT SET')
        if (process.env.DATABASE_URL) {
            console.log('Prefix:', process.env.DATABASE_URL.substring(0, 30) + '...')
        }
        console.log('Checking connection...')
        const count = await prisma.jobOrder.count()
        console.log(`JobOrder count: ${count}`)
        console.log("JobOrder table exists.")
    } catch (e: any) {
        if (e.message.includes('does not exist')) {
            console.log("JobOrder table MISSING.")
        } else {
            console.log("Error querying JobOrder:")
            console.log(e.message)
        }
    } finally {
        await prisma.$disconnect()
    }
}

main()
