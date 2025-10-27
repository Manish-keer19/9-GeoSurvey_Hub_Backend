import prisma from '../prisma.js'; // Adjust path as needed
export const RegisterUser = async (req, res) => {
    try {
        const { code, name, designation, level } = req.body;
        if (!code || !name || !designation || !level) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        const existingUser = await prisma.user.findUnique({
            where: { code: code }
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this code already exists' });
        }
        // const hasedCode = await bcrypt.hash(code, 10)
        // const newUser = await prisma.user.create({
        //   data: { code: hasedCode, name: name, designation: designation, level: level }
        // })
        const newUser = await prisma.user.create({
            data: { code: code, name: name, designation: designation, level: level }
        });
        res.status(201).json({ success: true, message: 'User registered successfully', data: { user: newUser } });
    }
    catch (error) {
        console.log("error in register", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
// Controller: Get Admin Report
export const GetAdminReport = async (req, res) => {
    try {
        const { eventId } = req.params;
        const parsedEventId = parseInt(eventId);
        if (isNaN(parsedEventId) || parsedEventId <= 0) {
            return res.status(400).json({ success: false, message: 'अमान्य इवेंट आईडी!' });
        }
        // Ensure user is admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'प्रशासक पहुंच की आवश्यकता है!' });
        }
        // Fetch event details
        const event = await prisma.event.findUnique({
            where: { id: parsedEventId },
            include: {
                createdBy: { select: { name: true, designation: true } },
            },
        });
        if (!event) {
            return res.status(404).json({ success: false, message: 'इवेंट नहीं मिला!' });
        }
        // Fetch assigned users for this event
        const assignments = await prisma.eventAssignment.findMany({
            where: { eventId: parsedEventId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        designation: true,
                        level: true,
                    },
                },
            },
        });
        const totalAssigned = assignments.length;
        // Count views and updates for this event (across all users)
        const viewCount = await prisma.eventView.count({
            where: { eventId: parsedEventId },
        });
        const updateCount = await prisma.eventUpdate.count({
            where: { eventId: parsedEventId },
        });
        // For table: Enrich assignments with view and update status per user
        const userTableData = await Promise.all(assignments.map(async (assignment) => {
            const user = assignment.user;
            // Check if this user viewed the event
            const userView = await prisma.eventView.findUnique({
                where: {
                    eventId_userId: {
                        eventId: parsedEventId,
                        userId: user.id,
                    },
                },
            });
            // Check if this user updated the event (latest one)
            const userUpdate = await prisma.eventUpdate.findFirst({
                where: {
                    eventId: parsedEventId,
                    userId: user.id,
                },
                orderBy: { updatedAt: 'desc' }, // Latest update
                include: {
                    medias: {
                        orderBy: { orderNum: 'asc' },
                    },
                    approvedBy: true, // Include approval status for better frontend (e.g., extra green)
                },
            });
            return {
                serialNo: assignments.indexOf(assignment) + 1,
                userId: user.id,
                name: user.name,
                designation: user.designation,
                level: user.level,
                viewed: !!userView, // Boolean for green/red in frontend
                viewedAt: userView?.viewedAt || null,
                updated: !!userUpdate, // Boolean for green/red in frontend
                updatedAt: userUpdate?.updatedAt || null,
                approved: !!userUpdate?.approvedAt, // New: For approved status
                userDetails: userUpdate, // Full update data for "Show Details" popup
            };
        }));
        // Stats message example (customize as needed)
        const statsMessage = `कुल ${totalAssigned} उपयोगकर्ताओं में से ${viewCount} ने देखा + ${updateCount} ने अपडेट किया`;
        res.status(200).json({
            success: true,
            message: 'रिपोर्ट सफलतापूर्वक उत्पन्न!',
            data: {
                eventDetails: {
                    name: event.name,
                    description: event.description,
                    startDateTime: event.startDateTime,
                    endDateTime: event.endDateTime,
                    issueDate: event.issueDate,
                    eventType: event.eventType,
                    location: event.location,
                    level: event.level,
                    peopleAttend: event.People_Attend,
                    createdBy: event.createdBy,
                    isPrevious: event.isPrevious,
                },
                stats: {
                    totalAssigned,
                    viewedCount: viewCount,
                    updatedCount: updateCount,
                    statsMessage, // For display in Hindi
                },
                userTable: userTableData, // Array for table rendering
            },
        });
    }
    catch (err) {
        console.error('Error in GetAdminReport:', err);
        res.status(500).json({ success: false, message: 'आंतरिक सर्वर त्रुटि।' });
    }
    finally {
        await prisma.$disconnect();
    }
};
export const GetAllUsersDetails = async (req, res) => {
    try {
        // Ensure user is admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'प्रशासक पहुंच की आवश्यकता है!' });
        }
        const { page = 1, limit = 10, search = '', level = '', role = '' } = req.query; // Filters: search, level (JILA/BLOCK), role (USER/ADMIN)
        const skip = (Number(page) - 1) * Number(limit);
        // Build where clause for filtering
        const whereClause = {};
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { designation: { contains: search, mode: 'insensitive' } },
                { code: { contains: search } },
            ];
        }
        if (level && level !== '') {
            whereClause.level = level;
        }
        if (role && role !== '') {
            whereClause.role = role;
        }
        // Fetch users with optional relations (e.g., count of created events, assigned events)
        const users = await prisma.user.findMany({
            where: whereClause,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            include: {
                createdEvents: {
                    select: { id: true, name: true, eventType: true },
                    take: 3, // Limit for preview
                },
                eventsAssigned: {
                    include: {
                        event: {
                            select: { id: true, name: true },
                        },
                    },
                    take: 5, // Limit for preview
                },
                // Optional: Include views/updates count if needed
                views: { select: { id: true }, take: 1 }, // Just count via length
                updates: { select: { id: true }, take: 1 },
            },
        });
        // Total count for pagination
        const total = await prisma.user.count({ where: whereClause });
        // Format users (e.g., add derived fields like event counts, formatted dates)
        const formattedUsers = users.map(user => ({
            ...user,
            lastVisitFormatted: user.lastVisit ? new Date(user.lastVisit).toLocaleString('hi-IN') : 'N/A',
            createdEventsCount: user.createdEvents?.length || 0,
            assignedEventsCount: user.eventsAssigned?.length || 0,
            viewsCount: user.views?.length || 0,
            updatesCount: user.updates?.length || 0,
        }));
        res.status(200).json({
            success: true,
            message: 'सभी उपयोगकर्ता विवरण सफलतापूर्वक प्राप्त!',
            data: {
                users: formattedUsers,
                pagination: {
                    current: Number(page),
                    pages: Math.ceil(total / Number(limit)),
                    total,
                    limit: Number(limit),
                },
            },
        });
    }
    catch (err) {
        console.error('Error fetching all users details:', err);
        res.status(500).json({ success: false, message: 'आंतरिक सर्वर त्रुटि।' });
    }
};
