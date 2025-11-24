import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../src/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { categoryId } = req.query

    // If no categoryId, return all workout sheet IDs
    if (!categoryId || categoryId === 'all') {
      const sheets = await prisma.trainingSheet.findMany({
        select: {
          id: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.status(200).json(sheets.map(s => s.id))
    }

    // Filter by categoryId
    const parsedCategoryId = Number(categoryId)

    if (isNaN(parsedCategoryId)) {
      return res.status(400).json({ error: 'Invalid categoryId' })
    }

    const sheets = await prisma.trainingSheet.findMany({
      where: {
        trainingDays: {
          some: {
            exerciseGroup: {
              categoryId: parsedCategoryId,
            },
          },
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.status(200).json(sheets.map(s => s.id))
  } catch (error) {
    console.error('Error fetching workout sheets:', error)
    return res.status(500).json({ error: 'Failed to fetch workout sheets' })
  }
}
