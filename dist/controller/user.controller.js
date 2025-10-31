// // import { Request, Response } from "express";
// // import prisma from "../prisma.js";
import prisma from "../prisma.js";
import { C_COLUMNS, AVG_FIELDS, selectBlockC } from "../utils/prisma/selectc.js";
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
/* ---------- 5. District Report – RAW SQL (fastest) ---------- */
export const getDistrictReport = async (req, res) => {
    try {
        const districtId = Number(req.params.id);
        const { type = "ALL" } = req.query;
        if (!["ALL", "R", "U"].includes(type))
            return res.status(400).json({ success: false, message: "Invalid type" });
        // Build column list
        const sumCols = C_COLUMNS.filter(c => !AVG_FIELDS.has(c))
            .map(c => `SUM(b.\`${c}\`) AS \`sum_${c}\``);
        const avgCols = Array.from(AVG_FIELDS)
            .map(c => `SUM(b.\`${c}\`) AS \`sum_${c}\`, COUNT(b.\`${c}\`) AS \`cnt_${c}\``);
        const whereType = type === "ALL" ? "" : `AND b.\`Block_Type\` = '${type}'`;
        const sql = `
      SELECT
        COUNT(b.\`bolck_Id\`) AS \`block_cnt\`,
        ${[...sumCols, ...avgCols].join(',\n        ')}
      FROM \`block_vd\` b
      JOIN \`districtblockmap\` m ON b.\`bolck_Id\` = m.\`blockId\`
      WHERE m.\`districtId\` = ?
      ${whereType}
    `;
        // Use $queryRaw with ? placeholder (safe)
        const [raw] = await prisma.$queryRawUnsafe(sql, districtId);
        const aggregated = {};
        let blockCount = 0;
        for (const [k, v] of Object.entries(raw)) {
            if (k === "block_cnt") {
                blockCount = Number(v);
                continue;
            }
            if (k.startsWith("sum_")) {
                const col = k.slice(4);
                aggregated[col] = Number(v);
            }
            else if (k.startsWith("cnt_")) {
                const col = k.slice(4);
                const sum = aggregated[col] ?? 0;
                const cnt = Number(v);
                if (AVG_FIELDS.has(col) && cnt > 0) {
                    aggregated[col] = Number((sum / cnt).toFixed(2));
                }
            }
        }
        const district = await prisma.district.findUnique({
            where: { district_id: districtId },
            select: { district_name: true },
        });
        res.json({
            success: true,
            data: {
                district_id: districtId,
                district_name: district?.district_name,
                type,
                blockCount,
                aggregated,
            },
        });
    }
    catch (e) {
        console.error("Raw query failed:", e);
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
                block_name: { contains: clean },
                Block_Type: { in: ["R", "U"] },
                districtblockmap: { some: { districtId: Number(districtId) } },
            },
            select: selectBlockC(),
        });
        if (!blocks.length)
            return res.status(404).json({ success: false, message: "Block not found" });
        const sum = {};
        const cnt = {};
        blocks.forEach(b => {
            C_COLUMNS.forEach(col => {
                const v = b[col];
                if (typeof v === "number") {
                    sum[col] = (sum[col] || 0) + v;
                    cnt[col] = (cnt[col] || 0) + 1;
                }
            });
        });
        Object.keys(sum).forEach(k => {
            if (AVG_FIELDS.has(k) && cnt[k])
                sum[k] = Number((sum[k] / cnt[k]).toFixed(2));
        });
        const display = blocks.length > 1 ? `${clean} (R + U)` : blocks[0].block_name;
        const result = {
            bolck_Id: -1,
            block_name: display,
            Block_Type: "R/U",
            ...sum,
        };
        res.json({ success: true, data: result });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
