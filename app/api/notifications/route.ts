import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/auth'

export async function GET() {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const storedNotifs = await prisma.$queryRaw<{
      id: string
      type: string
      title: string
      message: string
      isRead: boolean
      link: string | null
      createdAt: string
    }[]>`
      SELECT id, type, title, message,
             isRead, link, createdAt
      FROM Notification
      ORDER BY createdAt DESC
      LIMIT 40`

    const systemNotifs: {
      id: string
      type: string
      title: string
      message: string
      isRead: boolean
      link: string | null
      createdAt: string
      isSystem: boolean
    }[] = []

    const pendingResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM Applicant
      WHERE status = 'Applied'`
    const pendingCount = Number(pendingResult[0].count)

    if (pendingCount > 0) {
      systemNotifs.push({
        id: 'system-pending-applicants',
        type: 'pending_review',
        title: `${pendingCount} Pending Application${pendingCount > 1 ? 's' : ''}`,
        message: `${pendingCount} applicant${pendingCount > 1 ? 's are' : ' is'} awaiting review. Click to review now.`,
        isRead: false,
        link: '/applicants',
        createdAt: new Date().toISOString(),
        isSystem: true
      })
    }

    const underReviewResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM Applicant
      WHERE status = 'Under Review'`
    const underReviewCount = Number(underReviewResult[0].count)

    if (underReviewCount > 0) {
      systemNotifs.push({
        id: 'system-under-review',
        type: 'status_changed',
        title: `${underReviewCount} Under Review`,
        message: `${underReviewCount} applicant${underReviewCount > 1 ? 's are' : ' is'} currently under review.`,
        isRead: false,
        link: '/applicants',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        isSystem: true
      })
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const recentHiresResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM Employee
      WHERE createdAt >= ${sevenDaysAgo}`
    const recentHires = Number(recentHiresResult[0].count)

    if (recentHires > 0) {
      systemNotifs.push({
        id: 'system-recent-hires',
        type: 'new_employee',
        title: `${recentHires} New Employee${recentHires > 1 ? 's' : ''} This Week`,
        message: `${recentHires} new employee${recentHires > 1 ? 's have' : ' has'} been added in the last 7 days.`,
        isRead: false,
        link: '/employees',
        createdAt: new Date(Date.now() - 120000).toISOString(),
        isSystem: true
      })
    }

    const missingIdsResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM Employee
      WHERE status = 'Active'
      AND (
        sssNumber IS NULL OR sssNumber = '' OR
        philhealthNumber IS NULL OR philhealthNumber = '' OR
        pagibigNumber IS NULL OR pagibigNumber = ''
      )`
    const missingIds = Number(missingIdsResult[0].count)

    if (missingIds > 0) {
      systemNotifs.push({
        id: 'system-missing-ids',
        type: 'pending_review',
        title: `${missingIds} Employee${missingIds > 1 ? 's' : ''} Missing Gov IDs`,
        message: `${missingIds} active employee${missingIds > 1 ? 's are' : ' is'} missing SSS, PhilHealth, or PAG-IBIG IDs.`,
        isRead: false,
        link: '/benefits',
        createdAt: new Date(Date.now() - 180000).toISOString(),
        isSystem: true
      })
    }

    const interviewResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM Applicant
      WHERE status = 'Interview Scheduled'`
    const interviewCount = Number(interviewResult[0].count)

    if (interviewCount > 0) {
      systemNotifs.push({
        id: 'system-interviews',
        type: 'review_scheduled',
        title: `${interviewCount} Interview${interviewCount > 1 ? 's' : ''} Scheduled`,
        message: `${interviewCount} applicant${interviewCount > 1 ? 's have' : ' has'} interviews scheduled and awaiting decision.`,
        isRead: false,
        link: '/applicants',
        createdAt: new Date(Date.now() - 240000).toISOString(),
        isSystem: true
      })
    }

    const allNotifs = [...systemNotifs, ...storedNotifs]

    const storedUnread = storedNotifs.filter(n => !n.isRead).length
    const unreadCount = systemNotifs.length + storedUnread

    return Response.json({
      notifications: allNotifs,
      unreadCount,
      systemCount: systemNotifs.length,
      storedCount: storedNotifs.length
    })

  } catch (error) {
    console.error('Notifications API error:', error)
    return Response.json({
      notifications: [],
      unreadCount: 0,
      systemCount: 0,
      storedCount: 0
    })
  }
}
