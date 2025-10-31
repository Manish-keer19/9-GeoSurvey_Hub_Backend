// // import { Request, Response } from "express";
// // import prisma from "../prisma.js";


// // type DistrictType = "R" | "U";

// // // ✅ Get all districts
// // export const getAllDistricts = async (req: Request, res: Response) => {
// //   try {
// //     const districts = await prisma.district.findMany({
     
// //     });

// //     res.status(200).json({ success: true, data: districts });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ success: false, message: "Server error" });
// //   }
// // };

// // // ✅ Get districts by type (R or U)
// // export const getDistrictsByType = async (req: Request, res: Response) => {
// //   try {
// //     const { type } = req.params;

// //     if (!["R", "U"].includes(type)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid type. Use 'R' for Rural or 'U' for Urban.",
// //       });
// //     }

// //     const districts = await prisma.district.findMany({
// //       where: {
// //         districtblockmap: {
// //           some: {
// //             block_vd: { Block_Type: type as DistrictType },
// //           },
// //         },
// //       },
// //       include: {
// //         districtblockmap: {
// //           include: {
// //             block_vd: true,
// //           },
// //         },
// //       },
// //     });

// //     res.status(200).json({ success: true, data: districts });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ success: false, message: "Server error" });
// //   }
// // };

// // // ✅ Get a single district and its blocks
// // export const getDistrictWithBlocks = async (req: Request, res: Response) => {
// //   try {
// //     const { id } = req.params;
// //     const districtId = parseInt(id);

// //     const district = await prisma.district.findUnique({
// //       where: { district_id: districtId },
// //       include: {
// //         districtblockmap: {
// //           include: {
// //             block_vd: true,
// //           },
// //         },
// //       },
// //     });

// //     if (!district) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "District not found",
// //       });
// //     }

// //     res.status(200).json({ success: true, data: district });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ success: false, message: "Server error" });
// //   }
// // };


// import { Request, Response } from "express";
// import prisma from "../prisma.js";

// type BlockType = "R" | "U";


// // ✅ Get all districts
// export const getAllDistricts = async (req: Request, res: Response) => {
//   try {
//     const districts = await prisma.district.findMany({
     
//     });

//     res.status(200).json({ success: true, data: districts });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ✅ Get districts by type (R or U)
// export const getDistrictsByType = async (req: Request, res: Response) => {
//   try {
//     const { type } = req.params;

//     if (!["R", "U"].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid type. Use 'R' for Rural or 'U' for Urban.",
//       });
//     }

//     const districts = await prisma.district.findMany({
//       where: {
//         districtblockmap: {
//           some: {
//             block_vd: { Block_Type: type as BlockType}
//           },
//         },
//       },
//       include: {
//         districtblockmap: {
//           include: {
//             block_vd: true,
//           },
//         },
//       },
//     });

//     res.status(200).json({ success: true, data: districts });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
// // === 1. Get District + Block Metadata (for dropdowns) ===
// export const getDistrictMeta = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const districtId = Number(id);

//     const district = await prisma.district.findUnique({
//       where: { district_id: districtId },
//       select: {
//         district_id: true,
//         district_name: true,
//         districtblockmap: {
//           select: {
//             block_vd: {
//               select: {
//                 bolck_Id: true,
//                 block_name: true,
//                 Block_Type: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!district) return res.status(404).json({ success: false, message: "District not found" });

//     const blocks = district.districtblockmap.map(m => m.block_vd);
//     res.json({ success: true, data: { ...district, blocks } });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // === 2. Get Full Block Data (for single block report) ===
// export const getBlockById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const blockId = Number(id);

//     const block = await prisma.block_vd.findUnique({
//       where: { bolck_Id: blockId },
//     });

//     if (!block) return res.status(404).json({ success: false, message: "Block not found" });

//     res.json({ success: true, data: block });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // === 3. Get Aggregated District Report (ALL/R/U) ===
// export const getDistrictReport = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { type = "ALL" } = req.query as { type?: "ALL" | "R" | "U" };
//     const districtId = Number(id);

//     if (!["ALL", "R", "U"].includes(type)) {
//       return res.status(400).json({ success: false, message: "Invalid type" });
//     }

//     const where: any = { districtblockmap: { some: { districtId } } };
//     if (type !== "ALL") {
//       where.districtblockmap.some.block_vd.Block_Type = type;
//     }

//     const blocks = await prisma.block_vd.findMany({ where });

//     const aggregated: Record<string, number> = {};
//     const counts: Record<string, number> = {};

//     blocks.forEach(block => {
//       Object.entries(block).forEach(([key, val]) => {
//         if (key.startsWith("c") && key !== "c84" && typeof val === "number") {
//           aggregated[key] = (aggregated[key] || 0) + val;
//           counts[key] = (counts[key] || 0) + 1;
//         }
//       });
//     });

//     // Convert sums → averages for percentage fields
//     const avgKeys = /^(c(20|21|22|23|25|26|27|28|30|31|32|33|35|36|37|38|40|41|42|43|45|46|47|48|50|51|52|53|56|57|58|59|62|63|64|65|66|68|69|70|71|72|74|75|76|77|79|80|81|82))$/;
//     Object.keys(aggregated).forEach(k => {
//       if (avgKeys.test(k)) {
//         aggregated[k] = counts[k] > 0 ? Number((aggregated[k] / counts[k]).toFixed(2)) : 0;
//       }
//     });

//     const district = await prisma.district.findUnique({
//       where: { district_id: districtId },
//       select: { district_name: true },
//     });

//     res.json({
//       success: true,
//       data: {
//         district_id: districtId,
//         district_name: district?.district_name,
//         type,
//         blockCount: blocks.length,
//         aggregated,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // === 4. Get Combined Block Report (R + U) ===

// export const getCombinedBlockReport = async (req: Request, res: Response) => {
//   try {
//     const { blockName, districtId } = req.body; // blockName = "Pusour", districtId = 5

//     if (!blockName || !districtId) {
//       return res.status(400).json({ success: false, message: "blockName and districtId required" });
//     }

//     const cleanName = blockName.trim();
//     console.log("Combining blocks for:", cleanName, "in district ID:", districtId);

//     // Find all blocks with name like "Pusour (R)" or "Pusour (U)" in this district
//     const blocks = await prisma.block_vd.findMany({
//       where: {
//         block_name: {
//           contains: cleanName,
          
//         },
//         Block_Type: { in: ["R", "U"] },
//         districtblockmap: {
//           some: { districtId: Number(districtId) },
//         },
//       },
//     });
//     console.log("Found blocks:",blocks.map(b=>({name:b.block_name,type:b.Block_Type})));

//     if (blocks.length === 0) {
//       return res.status(404).json({ success: false, message: "Block not found" });
//     }

//   const sameName = await prisma.block_vd.findMany({
//     where:{block_name:blockName}
//   })
//   console.log("Same name blocks:",sameName.map(b=>({name:b.block_name,type:b.Block_Type})));

//     // Sum + count
//     const sum: Record<string, number> = {};
//     const count: Record<string, number> = {};

//     blocks.forEach(block => {
//       Object.entries(block).forEach(([k, v]) => {
//         if (k.startsWith("c") && k !== "c84" && typeof v === "number") {
//           sum[k] = (sum[k] || 0) + v;
//           count[k] = (count[k] || 0) + 1;
//         }
//       });
//     });

//     // Average percentage fields
//     const avgFields = new Set([
//       "c20","c21","c22","c23","c25","c26","c27","c28",
//       "c30","c31","c32","c33","c35","c36","c37","c38",
//       "c40","c41","c42","c43","c45","c46","c47","c48",
//       "c50","c51","c52","c53","c56","c57","c58","c59",
//       "c62","c63","c64","c65","c66","c68","c69","c70","c71","c72",
//       "c74","c75","c76","c77","c79","c80","c81","c82"
//     ]);

//     Object.keys(sum).forEach(k => {
//       if (avgFields.has(k)) {
//         sum[k] = count[k] > 0 ? Number((sum[k] / count[k]).toFixed(2)) : 0;
//       }
//     });

//     const displayName = blocks.length > 1 ? `${cleanName} (R + U)` : blocks[0].block_name;

//     const result = {
//       bolck_Id: -1,
//       block_name: displayName,
//       Block_Type: "R/U",
//       ...sum,
//     };

//     res.json({ success: true, data: result });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };











import { Request, Response } from "express";
import prisma from "../prisma.js";
import { C_COLUMNS, AVG_FIELDS, selectBlockC } from "../utils/prisma/selectc.js";
type BlockType = "R" | "U";

/* ---------- 1. All Districts ---------- */
export const getAllDistricts = async (_: Request, res: Response) => {
  try {
    const districts = await prisma.district.findMany({
      select: { district_id: true, district_name: true },
      orderBy: { district_name: "asc" },
    });
    res.json({ success: true, data: districts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------- 2. Districts by Type ---------- */
export const getDistrictsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params as { type: BlockType };
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------- 3. District Meta (dropdown) ---------- */
export const getDistrictMeta = async (req: Request, res: Response) => {
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

    if (!district) return res.status(404).json({ success: false, message: "Not found" });

    const blocks = district.districtblockmap.map(m => m.block_vd);
    res.json({ success: true, data: { ...district, blocks } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------- 4. Single Block ---------- */
export const getBlockById = async (req: Request, res: Response) => {
  try {
    const blockId = Number(req.params.id);
    const block = await prisma.block_vd.findUnique({
      where: { bolck_Id: blockId },
      select: selectBlockC(),
    });

    if (!block) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: block });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------- 5. District Report – RAW SQL (fastest) ---------- */
export const getDistrictReport = async (req: Request, res: Response) => {
  try {
    const districtId = Number(req.params.id);
    const { type = "ALL" } = req.query as { type?: "ALL" | "R" | "U" };
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
    const [raw] = await prisma.$queryRawUnsafe<any[]>(sql, districtId);

    const aggregated: Record<string, number> = {};
    let blockCount = 0;

    for (const [k, v] of Object.entries(raw)) {
      if (k === "block_cnt") {
        blockCount = Number(v);
        continue;
      }
      if (k.startsWith("sum_")) {
        const col = k.slice(4);
        aggregated[col] = Number(v);
      } else if (k.startsWith("cnt_")) {
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
  } catch (e: any) {
    console.error("Raw query failed:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------- 6. Combined R+U Block Report ---------- */
export const getCombinedBlockReport = async (req: Request, res: Response) => {
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

    const sum: Record<string, number> = {};
    const cnt: Record<string, number> = {};

    blocks.forEach(b => {
      C_COLUMNS.forEach(col => {
        const v = (b as any)[col];
        if (typeof v === "number") {
          sum[col] = (sum[col] || 0) + v;
          cnt[col] = (cnt[col] || 0) + 1;
        }
      });
    });

    Object.keys(sum).forEach(k => {
      if (AVG_FIELDS.has(k) && cnt[k]) sum[k] = Number((sum[k] / cnt[k]).toFixed(2));
    });

    const display = blocks.length > 1 ? `${clean} (R + U)` : blocks[0].block_name;

    const result = {
      bolck_Id: -1,
      block_name: display,
      Block_Type: "R/U" as const,
      ...sum,
    };

    res.json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};