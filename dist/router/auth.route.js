import { Router } from 'express';
import { login, registerAdmin } from '../controller/auth.controller.js';
export const authRouter = Router();
authRouter.post('/login', login);
authRouter.post('/register-admin', registerAdmin);
