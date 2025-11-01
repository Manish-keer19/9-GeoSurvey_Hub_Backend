// // import { Request, Response } from "express";
// // import prisma from "../prisma.js";
import prisma from "../prisma.js";
import { selectBlockC } from "../utils/prisma/selectc.js";
/* ---------- 1. All Districts ---------- */
export const getAllDistricts = async (_, res) => {
    try {
        const districts = await prisma.district.findMany({
            select: { district_id: true, district_name: true },
            orderBy: { district_name: "asc" },
        });
        res.json({ success: true, data: districts });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
/* ---------- 2. Districts by Type ---------- */
export const getDistrictsByType = async (req, res) => {
    try {
        const { type } = req.params;
        if (!["R", "U"].includes(type))
            return res.status(400).json({ success: false, message: "Invalid type" });
        const districts = await prisma.district.findMany({
            where: { districtblockmap: { some: { block_vd: { Block_Type: type } } } },
            select: {
                district_id: true,
                district_name: true,
                districtblockmap: {
                    select: {
                        block_vd: { select: { bolck_Id: true, block_name: true, Block_Type: true } },
                    },
                },
            },
        });
        res.json({ success: true, data: districts });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
/* ---------- 3. District Meta (dropdown) ---------- */
export const getDistrictMeta = async (req, res) => {
    try {
        const districtId = Number(req.params.id);
        const district = await prisma.district.findUnique({
            where: { district_id: districtId },
            select: {
                district_id: true,
                district_name: true,
                districtblockmap: {
                    select: { block_vd: { select: { bolck_Id: true, block_name: true, Block_Type: true } } },
                },
            },
        });
        if (!district)
            return res.status(404).json({ success: false, message: "Not found" });
        const blocks = district.districtblockmap.map(m => m.block_vd);
        res.json({ success: true, data: { ...district, blocks } });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
/* ---------- 4. Single Block ---------- */
export const getBlockById = async (req, res) => {
    try {
        const blockId = Number(req.params.id);
        const block = await prisma.block_vd.findUnique({
            where: { bolck_Id: blockId },
            select: selectBlockC(),
        });
        if (!block)
            return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, data: block });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
/* ---------- 6. Combined R+U Block Report ---------- */
export const getCombinedBlockReport = async (req, res) => {
    try {
        const { blockName, districtId } = req.body;
        if (!blockName || !districtId)
            return res.status(400).json({ success: false, message: "blockName & districtId required" });
        const clean = blockName.trim();
        const blocks = await prisma.block_vd.findMany({
            where: {
                block_name: { contains: clean }, // Case-insensitive search for better matching
                Block_Type: { in: ["R", "U"] },
                districtblockmap: { some: { districtId: Number(districtId) } },
            },
            select: selectBlockC(),
        });
        console.log("Combining blocks:", blocks.map(b => ({ name: b.block_name, type: b.Block_Type })));
        if (!blocks.length)
            return res.status(404).json({ success: false, message: "Block not found" });
        // Initialize combined object with zeros for all c fields
        const combined = {
            bolck_Id: null,
            block_name: `${clean} R+U`,
            Block_Type: "R/U",
        };
        // Dynamically get c field keys from first block (assuming consistent schema)
        const cFields = Object.keys(blocks[0]).filter(key => key.startsWith('c'));
        cFields.forEach(field => {
            combined[field] = 0;
        });
        // Single pass per block to sum all fields (O(n * m) where m=83, n small)
        for (const block of blocks) {
            for (const field of cFields) {
                combined[field] += Number(block[field]) || 0;
            }
        }
        // Return only the combined sum data as object
        res.json({ success: true, data: combined });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const getDistrictCombinedReport = async (req, res) => {
    try {
        const districtId = Number(req.params.id);
        const { type = "ALL" } = req.query;
        // Validate type
        if (!["ALL", "R", "U"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid type. Must be one of: ALL, R, U",
            });
        }
        // Build the filter dynamically
        const blockFilter = type === "ALL"
            ? {}
            : {
                block_vd: {
                    Block_Type: type, // either 'R' or 'U'
                },
            };
        // Query with optimized selection: only fetch necessary fields for block_vd to reduce payload
        const districtData = await prisma.district.findUnique({
            where: { district_id: districtId },
            include: {
                districtblockmap: {
                    where: blockFilter,
                    include: {
                        block_vd: {
                            select: {
                                bolck_Id: true, // Include ID if needed for reference
                                block_name: true, // Optional: if you need block names elsewhere
                                // Dynamically select all 'c' fields; in Prisma, we can list them explicitly for optimization
                                // For brevity, assuming c1-c84; adjust based on exact schema
                                c1: true, c2: true, c3: true, c4: true, c5: true, c6: true, c7: true, c8: true, c9: true, c10: true,
                                c11: true, c12: true, c13: true, c14: true, c15: true, c16: true, c17: true, c18: true, c19: true, c20: true,
                                c21: true, c22: true, c23: true, c24: true, c25: true, c26: true, c27: true, c28: true, c29: true, c30: true,
                                c31: true, c32: true, c33: true, c34: true, c35: true, c36: true, c37: true, c38: true, c39: true, c40: true,
                                c41: true, c42: true, c43: true, c44: true, c45: true, c46: true, c47: true, c48: true, c49: true, c50: true,
                                c51: true, c52: true, c53: true, c54: true, c55: true, c56: true, c57: true, c58: true, c59: true, c60: true,
                                c61: true, c62: true, c63: true, c64: true, c65: true, c66: true, c67: true, c68: true, c69: true, c70: true,
                                c71: true, c72: true, c73: true, c74: true, c75: true, c76: true, c77: true, c78: true, c79: true, c80: true,
                                c81: true, c82: true, c83: true, c84: true,
                            },
                        },
                    },
                },
            },
        });
        // Handle not found
        if (!districtData) {
            return res
                .status(404)
                .json({ success: false, message: "District not found" });
        }
        // Extract blocks
        const blocks = districtData.districtblockmap.map((b) => b.block_vd);
        // Predefine cFields for robustness (avoids error if no blocks; based on schema up to c84)
        const cFields = Array.from({ length: 84 }, (_, i) => `c${i + 1}`);
        // Build report data using reduce for efficient summation
        const dataSums = {};
        cFields.forEach((field) => {
            dataSums[field] = blocks.reduce((sum, block) => sum + (block[field] ?? 0), 0);
        });
        const report = {
            district_name: districtData.district_name,
            type,
            blockCount: blocks.length,
            data: dataSums,
        };
        res.json({
            success: true,
            data: report,
        });
    }
    catch (e) {
        console.error("getDistrictCombinedReport error:", e);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
