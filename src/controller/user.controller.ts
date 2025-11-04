
import axios from "axios";
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


/* ---------- 6. Combined R+U Block Report ---------- */
export const getCombinedBlockReport = async (req: Request, res: Response) => {
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
    const combined: any = {
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


interface DistrictReport {
  district_name: string;
  type: "ALL" | "R" | "U";
  blockCount: number;
  data: Record<string, number>;
}

export const getDistrictCombinedReport = async (req: Request, res: Response) => {
  try {
    const districtId = Number(req.params.id);
    const { type = "ALL" } = req.query as { type?: "ALL" | "R" | "U" };

    // Validate type
    if (!["ALL", "R", "U"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be one of: ALL, R, U",
      });
    }

    // Build the filter dynamically
    const blockFilter =
      type === "ALL"
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
                c81: true, c82: true, c83: true,
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
    const dataSums: Record<string, number> = {};
    cFields.forEach((field) => {
      dataSums[field] = blocks.reduce((sum: any, block) => sum + (block[field as keyof typeof block] ?? 0), 0);
    });

    const report: DistrictReport = {
      district_name: districtData.district_name,
      type,
      blockCount: blocks.length,
      data: dataSums,
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (e) {
    console.error("getDistrictCombinedReport error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export const updateWrapperWithCsv = async (req: Request, res: Response) => {
  const DATAWRAPPER_API_TOKEN =
    process.env.DATAWRAPPER_API_TOKEN || "YOUR_NEW_TOKEN_HERE";
  const DATAWRAPPER_CHART_ID =
    process.env.DATAWRAPPER_CHART_ID || "YOUR_CHART_ID_HERE";

  try {
    // ⚙️ Ensure file is uploaded
    if (!req.files || !req.files.csv) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    // 🧠 express-fileupload gives you a File object
    const csvFile = req.files.csv as any;

    // Convert buffer → string
    const csv = csvFile.data.toString("utf-8");

    console.log("Received CSV from frontend:\n", csv.slice(0, 200) + "...");

    // 1️⃣ Upload CSV data to Datawrapper
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          "Content-Type": "text/csv",
        },
      }
    );

    console.log("Datawrapper upload status:", updateRes.status);

    if (![200, 204].includes(updateRes.status)) {
      console.error("Upload failed:", updateRes.status, updateRes.data);
      throw new Error("Failed to upload chart data");
    }

    // 2️⃣ Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    console.log("Publish response:", publishRes.status);

    if (publishRes.status !== 200) {
      console.error("Error publishing chart:", publishRes.status, publishRes.data);
      throw new Error("Failed to publish chart");
    }

    // ✅ Success
    res.json({
      success: true,
      message: "Datawrapper chart updated successfully",
    });
  } catch (error: any) {
    console.error(
      "Error updating Datawrapper chart:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Server error while updating Datawrapper chart",
    });
  }
};






export const updateWrapper = async (req: Request, res: Response) => {


  // const data = [{"District":"Balod","Value":95},{"District":"Baloda Bazar","Value":100},{"District":"Balrampur","Value":98},{"District":"Bastar","Value":90},{"District":"Bemetara","Value":95},{"District":"Bijapur","Value":91},{"District":"Bilaspur","Value":90},{"District":"Dantewada","Value":92},{"District":"Dhamtari","Value":94},{"District":"Durg","Value":92},{"District":"Gariaband","Value":95},{"District":"Gaurela-Pendra-Marwahi","Value":99},{"District":"Janjgir-Champa","Value":90},{"District":"Jashpur","Value":99},{"District":"Kabirdham","Value":90},{"District":"Khairagarh-Chhuikhadan-Gandai","Value":91},{"District":"Kondagaon","Value":90},{"District":"Korba","Value":98},{"District":"Koriya","Value":94},{"District":"Mahasamund","Value":97},{"District":"Manendragarh-Chirimiri-Bharatpur","Value":91},{"District":"Mohla-Manpur-Ambagarh Chowki","Value":91},{"District":"Mungeli","Value":94},{"District":"Narayanpur","Value":92},{"District":"Raigarh","Value":93},{"District":"Raipur","Value":15},{"District":"Rajnandgaon","Value":91},{"District":"Sakti","Value":96},{"District":"Sarangarh-Bilaigarh","Value":90},{"District":"Sukma","Value":95},{"District":"Surajpur","Value":94},{"District":"Surguja","Value":91},{"District":"Uttar Bastar Kanker","Value":94}];



  const data = await prisma.districtMap.findMany({

  });

  const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN || "YOUR_NEW_TOKEN_HERE";
  const DATAWRAPPER_CHART_ID = process.env.DATAWRAPPER_CHART_ID || "YOUR_CHART_ID_HERE";

  try {
    // Convert to CSV
    let csv = "District,Value\n" + data.map((d: any) => `${d.District},${d.Value}`).join("\n");

    console.log("Generated CSV:\n", csv);

    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          "Content-Type": "text/csv",
        },
      }
    );

    console.log("Datawrapper upload status:", updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error("Upload failed:", updateRes.status, updateRes.data);
      throw new Error("Failed to upload chart data");
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    console.log("Publish response:", publishRes.status);
    if (publishRes.status !== 200) {
      console.error("Error publishing chart:", publishRes.status, publishRes.data);
      throw new Error("Failed to publish chart");
    }

    res.json({ success: true, message: "Datawrapper chart updated successfully" });
  } catch (error: any) {
    console.error("Error updating Datawrapper chart:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }

}


export const createDistrictMaps = async (req: any, res: any) => {
  try {
    const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN;
    const DATAWRAPPER_CHART_ID = process.env.DATAWRAPPER_CHART_ID;

    if (!DATAWRAPPER_API_TOKEN || !DATAWRAPPER_CHART_ID) {
      throw new Error('Missing required environment variables: DATAWRAPPER_API_TOKEN or DATAWRAPPER_CHART_ID');
    }

    const { mapsData } = req.body;

    if (!mapsData || !Array.isArray(mapsData) || mapsData.length === 0) {
      return res.status(400).json({ success: false, message: 'mapsData must be a non-empty array' });
    }

    // Basic validation: each item should have District and Value
    const invalidItems = mapsData.filter((d: any) => !d.District || typeof d.Value !== 'number');
    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid data in mapsData: ${invalidItems.length} items missing District or Value` 
      });
    }

    // Optional: Lookup or generate district_id (example: assume you have a districts table)
    // const districts = await prisma.district.findMany({ where: { name: { in: mapsData.map(d => d.District) } }});
    // Then map district_id from lookup...

    const prismaData = mapsData.map((d: any) => ({
     district_id: d.district_id,
      district_name: d.District,
      district_value: d.Value,
    }));

    const dbResult = await prisma.districtMap.createMany({
      data: prismaData,
    });

    if (dbResult.count === 0) {
      throw new Error('No records were created in the database');
    }

    // Generate CSV from input data (matches structure)
    const csv = 'District,Value\n' + mapsData.map((d: any) => `${d.District},${d.Value}`).join('\n');
    console.log('Generated CSV:\n', csv);

    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          'Content-Type': 'text/csv',
        },
      }
    );

    console.log('Datawrapper upload status:', updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error('Upload failed:', updateRes.status, updateRes.data);
      throw new Error(`Failed to upload chart data: ${updateRes.status}`);
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    console.log('Publish response:', publishRes.status);
    if (publishRes.status !== 200) {
      console.error('Error publishing chart:', publishRes.status, publishRes.data);
      throw new Error(`Failed to publish chart: ${publishRes.status}`);
    }

    res.json({ 
      success: true, 
      message: 'District map created successfully',
      details: { createdCount: dbResult.count }
    });

  } catch (error: any) {
    console.error('Error in createDistrictMaps:', error.message || error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  } finally {
    // Optional: Disconnect Prisma if in a long-lived app
    // await prisma.$disconnect();
  }
};


export const getDistrictMapData = async (req: any, res: any) => {
  try {
    const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN;
    const DATAWRAPPER_CHART_ID = process.env.DATAWRAPPER_CHART_ID;

    if (!DATAWRAPPER_API_TOKEN || !DATAWRAPPER_CHART_ID) {
      throw new Error('Missing required environment variables: DATAWRAPPER_API_TOKEN or DATAWRAPPER_CHART_ID');
    }



    const data = await prisma.districtMap.findMany({

    });

    // Generate CSV from input data (matches structure)
    const csv = 'District,Value\n' + data.map((d: any) => `${d.district_name},${d.district_value}`).join('\n');
    console.log('Generated CSV:\n', csv);


    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          'Content-Type': 'text/csv',
        },
      }
    );

    console.log('Datawrapper upload status:', updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error('Upload failed:', updateRes.status, updateRes.data);
      throw new Error(`Failed to upload chart data: ${updateRes.status}`);
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    console.log('Publish response:', publishRes.status);
    if (publishRes.status !== 200) {
      console.error('Error publishing chart:', publishRes.status, publishRes.data);
      throw new Error(`Failed to publish chart: ${publishRes.status}`);
    }

    res.json({ 
      success: true, 
      message: 'District get successfully',
    //  data:{data,csv}
    });

  } catch (error: any) {
    console.error('Error in createDistrictMaps:', error.message || error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  } finally {
    // Optional: Disconnect Prisma if in a long-lived app
    // await prisma.$disconnect();
  }
};
