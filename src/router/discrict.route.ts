// 




import { Router } from "express";
import {
  getAllDistricts,
  getDistrictsByType,
//   getDistrictWithBlocks,
  getDistrictMeta,
  getBlockById,
  getDistrictReport,
  getCombinedBlockReport,
} from "../controller/user.controller.js";

export const discrictRoute = Router();

discrictRoute.get("/", getAllDistricts);
discrictRoute.get("/type/:type", getDistrictsByType);
// discrictRoute.get("/:id", getDistrictWithBlocks); // optional
discrictRoute.get("/:id/meta", getDistrictMeta);   // NEW – light
discrictRoute.get("/block/:id", getBlockById);       // NEW – single block
discrictRoute.get("/:id/report", getDistrictReport); // NEW – aggregated

// routes/block.routes.ts
discrictRoute.post("/combined-by-name", getCombinedBlockReport);

