import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();
export const registerUser = async (req, res) => {
    try {
        const { name, code, role } = req.body;
        if (!name || !code || !role) {
            return res.status(400).json({ success: false, message: "Name, code and role are required" });
        }
        const validRoles = ['ADMIN', 'DISTRICT_USER', 'VIDHANSABHA_USER', 'LOKSABHA_USER'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }
        const existingUser = await prisma.user_vandan.findUnique({
            where: { code },
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this code already exists" });
        }
        const newUser = await prisma.user_vandan.create({
            data: {
                name,
                code,
                role,
            },
        });
        return res.status(201).json({ success: true, message: "User registered successfully", data: { user: newUser } });
    }
    catch (error) {
        console.log("error in register user", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const registerAdmin = async (req, res) => {
    try {
        const { code, name } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: 'code is required' });
        }
        const existingUser = await prisma.user_vandan.findUnique({
            where: { code: code }
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this code already exists' });
        }
        const newUser = await prisma.user_vandan.create({
            data: { code: code, name: name || "Admin", role: "ADMIN" }
        });
        res.status(201).json({ success: true, message: 'Admin registered successfully', data: { user: newUser } });
    }
    catch (error) {
        console.log("error in register Admin", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
export const login = async (req, res) => {
    try {
        const { code, role } = req.body;
        console.log("code in login", code);
        if (!code || code.length !== 4 || !role) {
            return res.status(400).json({ success: false, message: 'All fileds are required' });
        }
        const user = await prisma.user_vandan.findUnique({
            where: { code, role: role },
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User Not found' });
        }
        if (user.code != code) {
            return res.status(401).json({ success: false, message: 'Invalid 4-digit code' });
        }
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ success: false, message: 'JWT secret not configured' });
        }
        const payload = {
            id: user.id,
            role: user.role,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            success: true,
            message: "Login Successful",
            data: {
                token: token,
                user: user
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user_vandan.findMany({
            select: {
                id: true,
                name: true,
                code: true,
                role: true,
            },
        });
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "No users found" });
        }
        return res.json({ success: true, data: users });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
