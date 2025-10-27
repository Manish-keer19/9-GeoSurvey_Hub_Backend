import { Router } from "express";
import { createEvent, UpdateEvent, getUserAssignedEvents, getAllEventsForAdmin, updateUserHomeVisit, MarkEventAsViewed } from "../controller/event.controller.js";
import { authentication, IsAdmin } from "../middleware/auth.js";
import { getUsersForAssignment } from "../controller/user.controller.js";
export const eventRoute = Router();
//  Admin Routes
eventRoute.post("/create-event", authentication, IsAdmin, createEvent);
eventRoute.get('/get-all-event-for-admin', authentication, IsAdmin, getAllEventsForAdmin);
//  user Routes
eventRoute.post("/update-event", authentication, UpdateEvent);
eventRoute.get("/get-events/:userId", authentication, getUserAssignedEvents);
eventRoute.get('/assignable', authentication, getUsersForAssignment);
eventRoute.get('/update-user-home-visit', authentication, updateUserHomeVisit);
eventRoute.get('/mark-event-as-veiw/:eventId', authentication, MarkEventAsViewed);
