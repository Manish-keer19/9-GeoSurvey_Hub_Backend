import express from 'express';
import {  createBlocks,  createDistricts, getAllDistricts, getBlocksByDistrict } from '../controller/user.controller.js';
export const userRoute = express.Router();


userRoute.get("/", (req, res) => {
  res.send("User Route is working!");
});

userRoute.post('/districts/bulk', createDistricts);
userRoute.post('/blocks/bulk', createBlocks);

userRoute.get('/blocks/district/:districtId', getBlocksByDistrict);
userRoute.get('/districts', getAllDistricts);
userRoute.get('/districts/:id', getAllDistricts);

