import { Router } from "express";
import { authentication, IsAdmin } from "../middleware/auth.js";
import { GetAdminReport, GetAllUsersDetails, RegisterUser } from "../controller/admin.controller.js";
export const adminRoute = Router();
adminRoute.get("/get-event-report/:eventId", authentication, IsAdmin, GetAdminReport);
adminRoute.post("/register-user", authentication, IsAdmin, RegisterUser);
adminRoute.get("/get-users-data", authentication, IsAdmin, GetAllUsersDetails);
