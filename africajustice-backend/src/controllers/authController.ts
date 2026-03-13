import { Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { User } from '../models/User'
import { AuthRequest } from '../middleware/auth'

export const registerController = async (req: any, res: Response) => {
  try {
    const { email, password, name, role, preferredLanguage } = req.body as {
      email?: string
      password?: string
      name?: string
      role?: string
      preferredLanguage?: string
    }

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'email, password, and name are required.',
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.',
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user with language preference
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: role || 'citizen',
      preferredLanguage: preferredLanguage || 'en',
    })

    // Generate JWT token (same as login)
    const jwtOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'],
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'replace-with-strong-secret',
      jwtOptions,
    )

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          preferredLanguage: user.preferredLanguage || 'en',
        },
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({
      success: false,
      message: 'Registration failed.',
    })
  }
}

export const loginController = async (req: any, res: Response) => {
  try {
    const { email, password, preferredLanguage } = req.body as {
      email?: string
      password?: string
      preferredLanguage?: string
    }

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required.',
      })
    }

    // Find user
    let user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // Update language if provided in login request
    if (preferredLanguage) {
      user = await User.findByIdAndUpdate(user.id, { preferredLanguage }, { new: true })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // Generate JWT
    const jwtOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'],
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'replace-with-strong-secret',
      jwtOptions,
    )

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          preferredLanguage: user.preferredLanguage || 'en',
        },
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      message: 'Login failed.',
    })
  }
}

export const logoutController = async (req: AuthRequest, res: Response) => {
  // JWT doesn't require explicit logout on backend
  // Client should remove token from storage
  return res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.',
  })
}

export const getCurrentUserController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User context missing.',
      })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user.',
    })
  }
}
