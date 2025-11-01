import { Router } from "express";
import { getAllDistricts, getDistrictsByType, 
//   getDistrictWithBlocks,  
getDistrictMeta, getBlockById, getDistrictReport, getCombinedBlockReport, } from "../controller/user.controller.js";
import { isAuthenticated } from "../middleware/auth.js";
export const discrictRoute = Router();
discrictRoute.get("/", isAuthenticated, getAllDistricts);
discrictRoute.get("/type/:type", isAuthenticated, getDistrictsByType);
// discrictRoute.get("/:id", getDistrictWithBlocks); // optional
discrictRoute.get("/:id/meta", isAuthenticated, getDistrictMeta); // NEW – light
discrictRoute.get("/block/:id", isAuthenticated, getBlockById); // NEW – single block
discrictRoute.get("/:id/report", isAuthenticated, getDistrictReport); // NEW – aggregated
// routes/block.routes.ts
discrictRoute.post("/combined-by-name", getCombinedBlockReport);
