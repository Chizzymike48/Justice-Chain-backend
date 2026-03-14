import mongoose from 'mongoose'

const connectDB = async (): Promise<void> => {
  if (process.env.ENABLE_MONGO === 'false') {
    console.warn('⚠️ MongoDB disabled via ENABLE_MONGO=false')
    return
  }
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not set. Skipping MongoDB connection.')
    return
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || '', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    console.log(`📊 Database Name: ${conn.connection.name}`)

    mongoose.connection.on('error', (err: Error) => {
      console.error('❌ MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })

    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('🛑 MongoDB connection closed due to app termination')
      process.exit(0)
    })
  } catch (error) {
    console.error('❌ MongoDB connection error:', (error as Error).message)
    console.warn('⚠️ Continuing without MongoDB. Some features may be unavailable.')
  }
}

export default connectDB
