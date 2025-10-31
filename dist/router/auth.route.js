import { Router } from "express";
import { login, registerUser } from "../controller/auth.controller.js";
export const authRoute = Router();
authRoute.post("/register", registerUser);
authRoute.post("/login", login);
