import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './db'
import { User } from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function createUser(userData: {
  email: string
  password: string
  firstName: string
  lastName: string
}): Promise<User> {
  const hashedPassword = await hashPassword(userData.password)
  
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      name: `${userData.firstName} ${userData.lastName}`,
      passwordHash: hashedPassword,
    }
  })
  
  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user
  return {
    ...userWithoutPassword,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export async function findUserByEmail(email: string): Promise<(User & { password: string }) | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) return null
  
  return {
    ...user,
    password: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export async function findUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id }
  })
  
  if (!user) return null
  
  const { passwordHash: _, ...userWithoutPassword } = user
  return {
    ...userWithoutPassword,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
  }
  return { valid: true }
}

export function generatePasswordResetToken(email: string): string {
  return jwt.sign({ email, type: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' })
}

export function verifyPasswordResetToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; type: string }
    if (decoded.type === 'password-reset') {
      return { email: decoded.email }
    }
    return null
  } catch {
    return null
  }
}

export async function updateUser(id: string, userData: Partial<{
  firstName: string
  lastName: string
  email: string
}>): Promise<User | null> {
  try {
    // Transform firstName/lastName to name if provided
    const updateData: any = { ...userData }
    if (userData.firstName || userData.lastName) {
      const currentUser = await prisma.user.findUnique({ where: { id } })
      if (currentUser) {
        const firstName = userData.firstName || currentUser.name.split(' ')[0] || ''
        const lastName = userData.lastName || currentUser.name.split(' ').slice(1).join(' ') || ''
        updateData.name = `${firstName} ${lastName}`.trim()
      }
      delete updateData.firstName
      delete updateData.lastName
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  } catch {
    return null
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const decoded = verifyPasswordResetToken(token)
    if (!decoded) {
      return { success: false, error: 'Invalid or expired reset token' }
    }

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message }
    }

    const hashedPassword = await hashPassword(newPassword)
    
    const user = await prisma.user.update({
      where: { email: decoded.email },
      data: { passwordHash: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return {
      success: true,
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, error: 'Failed to reset password' }
  }
}

export async function verifyAuth(request: Request): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No valid authorization header' }
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return { success: false, error: 'Invalid token' }
    }

    const user = await findUserById(decoded.userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}