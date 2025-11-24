import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authConfig } from '../../../src/lib/auth-config'
import prisma from '../../../src/lib/prisma'

// CLEANUP: Added interface for user profile fields
interface UserProfile {
  id: number;
  email: string;
  name: string | null;
}

// CLEANUP: Defined static field selection instead of duplicating in queries
const publicUserFields = {
  id: true,
  email: true,
  name: true,
} as const;

// CLEANUP: Added proper request/response types for better type safety
interface ProfileRequestBody {
  name?: string;
}

type ProfileResponse = 
  | { user: UserProfile }
  | { message: string }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProfileResponse>
) {
  // CLEANUP: Improved session authentication check with proper typing
  const session = await getServerSession(req, res, authConfig as any);
  
  if (!(session as any)?.user?.email) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  // CLEANUP: Get user ID from email instead of casting to any
  const userEmail = (session as any).user.email as string;

  // GET — retrieve user profile
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findFirst({
        where: { email: userEmail },
        select: publicUserFields,
      });

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      return res.json({ user });
    } catch (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ message: 'Erro ao carregar perfil' });
    }
  }

  // PUT — update user profile
  if (req.method === 'PUT') {
    const {
      name,
    }: ProfileRequestBody = req.body;

    // CLEANUP: Build update object with explicit type safety
    const updateData: Partial<UserProfile> = {};

    if (typeof name === 'string') updateData.name = name || null;

    try {
      const updatedUser = await prisma.user.update({
        where: { id: (session as any).user.id ? parseInt((session as any).user.id) : 0 },
        data: updateData,
        select: publicUserFields,
      });

      return res.json({ user: updatedUser });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      return res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
  }

  // CLEANUP: Explicit method validation
  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
