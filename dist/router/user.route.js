import express from 'express';
import { createBlock, createBlocks, createDistrict, createDistricts, getAllDistricts, getBlock, getBlocksByDistrict } from '../controller/user.controller.js';
export const userRoute = express.Router();
userRoute.get("/", (req, res) => {
    res.send("User Route is working!");
});
userRoute.post('/districts', createDistrict);
userRoute.post('/districts/bulk', createDistricts);
userRoute.post('/blocks', createBlock);
userRoute.post('/blocks/bulk', createBlocks);
userRoute.get('/blocks/:id', getBlock);
userRoute.get('/blocks/district/:districtId', getBlocksByDistrict);
userRoute.get('/districts', getAllDistricts);
userRoute.get('/districts/:id', getAllDistricts);
