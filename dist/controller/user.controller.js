import prisma from "../prisma.js";
export const getUsersForAssignment = async (req, res) => {
    try {
        const { level } = req.query; // Optional: ?level=JILA or ?level=BLOCK or empty for all
        // Where clause: Always non-admins (role=USER), optional level filter
        const whereClause = {
            role: 'USER' // Only regular users, not admins
        };
        if (level === 'JILA' || level === 'BLOCK') {
            whereClause.level = level;
        } // If no level, all users (JILA + BLOCK)
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                designation: true,
                level: true
            },
            orderBy: {
                name: 'asc' // Alphabetical by name for easy selection
            }
        });
        return res.status(200).json({
            success: true,
            message: `Fetched ${users.length} users${level ? ` for level ${level}` : ''}`,
            data: users // e.g., [{ id: 1, name: 'Vishal Rajput', designation: 'Jila Adhyaksh', level: 'JILA' }, ...]
        });
    }
    catch (error) {
        console.error('Error fetching users for assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};
