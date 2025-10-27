import { uploadInCloudinary } from "../utils/cloudinary.utils.js";
import prisma from "../prisma.js";
export const createEvent = async (req, res) => {
    try {
        // Grab all the form data - some might be optional like desc
        const { name, description = '', issueDate, location, startDateTime, endDateTime, eventType, assignedUserIds, level } = req.body;
        console.log("name:", name);
        console.log("description:", description);
        console.log("issueDate:", issueDate);
        console.log("location:", location);
        console.log("startDateTime:", startDateTime);
        console.log("endDateTime:", endDateTime);
        console.log("eventType:", eventType);
        console.log("assignedUserIds:", assignedUserIds);
        console.log("level:", level);
        console.log("Full req.body:", req.body);
        // Basic checks - can't create without these
        if (!name || !issueDate || !startDateTime || !endDateTime || !eventType || !assignedUserIds || !level) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled! Including assigned users.' });
        }
        // assignedUserIds should be array
        const userIds = Array.isArray(assignedUserIds) ? assignedUserIds : [assignedUserIds];
        if (userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one user must be assigned!' });
        }
        const adminId = req.user.id;
        if (!adminId) {
            return res.status(400).json({ success: false, message: 'No admin found!' });
        }
        console.log("admin Id", adminId);
        const admin = await prisma.user.findUnique({
            where: { id: adminId }
        });
        if (!admin) {
            return res.status(400).json({ success: false, message: 'No admin found!' });
        }
        // Check all selected users exist and are not ADMIN
        const users = await prisma.user.findMany({
            where: { id: { in: userIds.map(id => parseInt(id)) } }
        });
        if (users.length !== userIds.length) {
            return res.status(400).json({ success: false, message: 'One or more selected users do not exist.' });
        }
        // Check no ADMIN in selected (optional, per your code)
        const adminUsers = users.filter(u => u.role === 'ADMIN');
        if (adminUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Cannot assign to admin users.' });
        }
        // Create the event first (no single assignedToId)
        const newEvent = await prisma.event.create({
            data: {
                name,
                description,
                startDateTime: new Date(startDateTime),
                endDateTime: new Date(endDateTime),
                issueDate: new Date(issueDate),
                location,
                eventType: eventType, // Prisma will handle enum
                level: level, // jila or block
                isPrevious: false, // New ones are ongoing
                createdById: admin.id,
                People_Attend: 0 // Default, users will update
            }
        });
        console.log('Event created with ID:', newEvent.id);
        // Create assignments for multiple users (junction table)
        const assignments = [];
        for (const userId of userIds) {
            const assignment = await prisma.eventAssignment.create({
                data: {
                    eventId: newEvent.id,
                    userId: parseInt(userId)
                }
            });
            assignments.push(assignment);
        }
        console.log(`Assigned ${assignments.length} users to event ${newEvent.id}`);
        res.status(201).json({
            success: true,
            message: 'Event created and assigned successfully!',
            data: {
                event: newEvent,
                assignments
            }
        });
    }
    catch (err) {
        console.error('Error in createEvent:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
export const UpdateEvent = async (req, res) => {
    try {
        const { updatedLocation, updatedStartDateTime, updatedEndDateTime, personsAttended, eventId } = req.body || {};
        const userId = req.user.id; // From auth middleware
        console.log("req.body in updateEvent", req.body);
        // Basic checks
        if (!eventId || !userId) {
            return res.status(400).json({ success: false, message: 'Event ID and User ID required!' });
        }
        if (!updatedStartDateTime || !updatedEndDateTime || !updatedLocation || personsAttended === undefined) {
            return res.status(400).json({ success: false, message: 'All update fields must be filled!' });
        }
        // Check if update exists, then create or update
        const existingUpdate = await prisma.eventUpdate.findFirst({
            where: { eventId: parseInt(eventId), userId }
        });
        let updateRecord;
        if (existingUpdate) {
            updateRecord = await prisma.eventUpdate.update({
                where: { id: existingUpdate.id },
                data: {
                    personsAttended: parseInt(personsAttended),
                    updatedStartDateTime: new Date(updatedStartDateTime),
                    updatedEndDateTime: new Date(updatedEndDateTime),
                    updatedLocation
                }
            });
        }
        else {
            updateRecord = await prisma.eventUpdate.create({
                data: {
                    eventId: parseInt(eventId),
                    userId,
                    personsAttended: parseInt(personsAttended),
                    updatedStartDateTime: new Date(updatedStartDateTime),
                    updatedEndDateTime: new Date(updatedEndDateTime),
                    updatedLocation
                }
            });
        }
        // Files handling (up to 10 photos + 1 video + 5 media photos)
        const files = req.files || {}; // Default to empty object if no files
        const photos = Array.isArray(files.photos) ? files.photos : (files.photos ? [files.photos] : []);
        const video = files.video ? (Array.isArray(files.video) ? files.video[0] : files.video) : null;
        const mediaPhotos = Array.isArray(files.mediaPhotos) ? files.mediaPhotos : (files.mediaPhotos ? [files.mediaPhotos] : []);
        const allFiles = [...photos, ...(video ? [video] : []), ...mediaPhotos];
        if (allFiles.length > 16) { // 10 + 1 + 5
            return res.status(400).json({ success: false, message: 'Max 10 photos + 1 video + 5 media photos!' });
        }
        const mediaRecords = [];
        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            if (!file)
                continue;
            // Video size check (min 10MB)
            if (file.mimetype?.startsWith('video/') && file.size < 10 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: 'वीडियो कम से कम 10 MB का होना चाहिए!' });
            }
            try {
                const uploadResult = await uploadInCloudinary({
                    data: file.tempFilePath || file.data,
                    folder: 'INC_Events',
                    isUpload: true
                });
                let mediaType;
                if (file.mimetype?.startsWith('image/')) {
                    mediaType = "PHOTO";
                }
                else if (file.mimetype?.startsWith('video/')) {
                    mediaType = "VIDEO";
                }
                else {
                    continue; // Skip unknown
                }
                const media = await prisma.media.create({
                    data: {
                        eventId: parseInt(eventId),
                        updateId: updateRecord.id, // Link to this user's update
                        type: mediaType,
                        url: uploadResult.secure_url,
                        size: file.size,
                        orderNum: i + 1
                    }
                });
                mediaRecords.push(media);
                console.log('Uploaded media:', media.id);
            }
            catch (uploadErr) {
                console.error('Upload failed:', uploadErr);
            }
        }
        // Fetch user's update with media
        const userUpdateWithMedia = await prisma.eventUpdate.findUnique({
            where: { id: updateRecord.id },
            include: {
                medias: true,
                user: { select: { name: true } },
                event: {
                    include: {
                        assignments: {
                            include: { user: { select: { name: true, designation: true } } }
                        }
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'Event updated successfully!',
            data: { update: userUpdateWithMedia }
        });
    }
    catch (err) {
        console.error('Error in UpdateEvent:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
export const getUserAssignedEvents = async (req, res) => {
    try {
        const { userId } = req.params; // Assume route: /api/events/user/:userId
        console.log('Requested userId from params:', userId, 'Type:', typeof userId); // Debug log
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const parsedUserId = parseInt(userId);
        if (isNaN(parsedUserId)) {
            return res.status(400).json({ success: false, message: 'Invalid User ID (must be number)' });
        }
        console.log('Parsed userId:', parsedUserId); // Debug
        const events = await prisma.eventAssignment.findMany({
            where: { userId: parsedUserId },
            include: {
                event: {
                    include: {
                        createdBy: { select: { name: true, designation: true } },
                        assignments: {
                            include: {
                                user: { select: { name: true, designation: true, level: true } }
                            }
                        },
                        updates: {
                            include: {
                                user: { select: { name: true } },
                                medias: true
                            }
                        },
                        medias: true
                    }
                }
            }
        });
        console.log("Full events query result:", events); // Debug: Check if empty or has data
        // Optional: Flatten for frontend (return assignments with event nested)
        const formattedEvents = events.map(assignment => ({
            ...assignment.event, // Main event data
            assignmentId: assignment.id, // Extra if needed
            assignedAt: assignment.assignedAt
        }));
        return res.status(200).json({
            success: true,
            message: `Found ${events.length} assigned events for user ${parsedUserId}`,
            data: formattedEvents // Or raw events if frontend handles nested
        });
    }
    catch (error) {
        console.error('Error in getUserAssignedEvents:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user events',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
export const MarkEventAsViewed = async (req, res) => {
    try {
        const { eventId } = req.params;
        const parsedEventId = parseInt(eventId);
        const userId = req.user.id;
        console.log("event id is ", eventId);
        if (isNaN(parsedEventId) || parsedEventId <= 0) {
            return res.status(400).json({ success: false, message: 'अमान्य इवेंट आईडी!' });
        }
        if (!userId) {
            return res.status(401).json({ success: false, message: 'उपयोगकर्ता प्रमाणीकरण आवश्यक!' });
        }
        // Check if already viewed (due to unique constraint in schema)
        const existingView = await prisma.eventView.findUnique({
            where: {
                eventId_userId: {
                    eventId: parsedEventId,
                    userId,
                },
            },
        });
        if (existingView) {
            return res.status(200).json({
                success: true,
                message: 'इवेंट पहले से देखा गया।',
                data: { viewedAt: existingView.viewedAt },
            });
        }
        // Create new view record
        const newView = await prisma.eventView.create({
            data: {
                eventId: parsedEventId,
                userId,
            },
            include: {
                event: { select: { name: true } },
                user: { select: { name: true } },
            },
        });
        res.status(201).json({
            success: true,
            message: 'इवेंट देखा गया सफलतापूर्वक चिह्नित!',
            data: newView,
        });
    }
    catch (error) {
        console.error('Error marking event as viewed:', error);
        res.status(500).json({ success: false, message: 'आंतरिक सर्वर त्रुटि।' });
    }
};
export const getAllEventsForAdmin = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await prisma.user.findUnique({
            where: { id: adminId }
        });
        if (!admin) {
            return res.status(400).json({ success: false, message: 'No admin found!' });
        }
        const events = await prisma.event.findMany({
            where: { createdById: adminId },
            include: {
                assignments: {
                    include: {
                        user: { select: { name: true, designation: true } }
                    }
                },
                updates: {
                    include: {
                        user: { select: { name: true } },
                        medias: true
                    }
                },
                medias: true
            }
        });
        return res.status(200).json({
            success: true,
            message: `Fetched ${events.length} events for admin ${adminId}`,
            data: events
        });
    }
    catch (error) {
        console.error('Error fetching events for admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch events'
        });
    }
};
// export const markEventAsViewed = async (req: any, res: any) => {
//   try {
//     const { eventId } = req.params;
//     const userId = req.user.id; // Extract from authenticated user (e.g., JWT or session)
//     // Check if the user has already viewed this event (due to unique constraint)
//     const existingView = await prisma.eventView.findUnique({
//       where: {
//         eventId_userId: {
//           eventId: parseInt(eventId),
//           userId: parseInt(userId),
//         },
//       },
//     });
//     if (existingView) {
//       // Already viewed, no need to create duplicate
//       return res.status(200).json({
//         success: true,
//         message: 'Event already viewed by this user.',
//         data: { viewedAt: existingView.viewedAt },
//       });
//     }
//     // Create a new view record
//     const newView = await prisma.eventView.create({
//       data: {
//         eventId: parseInt(eventId),
//         userId: parseInt(userId),
//       },
//     });
//     res.status(201).json({
//       success: true,
//       message: 'Event view logged successfully.',
//       data: newView,
//     });
//   } catch (error) {
//     console.error('Error marking event as viewed:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to log event view.',
//       error: error?.message,
//     });
//   }
// };
export const updateUserHomeVisit = async (req, res) => {
    try {
        const userId = req.user.id; // From your auth middleware (e.g., JWT)
        const now = new Date();
        const currentMonthYear = now.toISOString().slice(0, 7); // e.g., '2025-10'
        // Fetch current user data
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }
        const lastVisitMonthYear = user.lastVisit ? user.lastVisit.toISOString().slice(0, 7) : null;
        let newMonthlyCount;
        if (!user.lastVisit || lastVisitMonthYear !== currentMonthYear) {
            // First visit ever, or new month: Start count at 1
            newMonthlyCount = 1;
        }
        else {
            // Same month: Increment existing count
            newMonthlyCount = user.monthlyCount + 1;
        }
        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                lastVisit: now,
                monthlyCount: newMonthlyCount,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Home visit tracked successfully.',
            data: {
                lastVisit: updatedUser.lastVisit,
                monthlyCount: updatedUser.monthlyCount,
                currentMonth: currentMonthYear,
            },
        });
    }
    catch (error) {
        console.error('Error updating user home visit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update home visit.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
