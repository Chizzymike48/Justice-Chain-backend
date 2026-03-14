// S3 Config stub
export const s3Config = {
  bucket: process.env.AWS_S3_BUCKET || 'justicechain',
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
}

export default s3Config
