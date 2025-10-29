import { Router } from "express";
import { getAllDistricts, getDistrictsByType, getDistrictWithBlocks } from "../controller/user.controller.js";
export const discrictRoute = Router();
discrictRoute.get("/", getAllDistricts); // All districts
discrictRoute.get("/type/:type", getDistrictsByType); // By type R/U
discrictRoute.get("/:id", getDistrictWithBlocks); // District + blocks
