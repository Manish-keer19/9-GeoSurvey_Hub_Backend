
import { Router } from "express";
import { getAllUsers, login, registerAdmin, registerUser } from "../controller/auth.controller.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.js";


export const authRoute = Router();

// authRoute.post("/register",registerUser);
authRoute.post("/register-user",registerUser);
authRoute.post("/register-admin",registerAdmin);
authRoute.post("/login",login);
authRoute.get("/all-users",isAuthenticated,isAdmin,getAllUsers);


