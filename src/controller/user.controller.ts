import { Request, Response } from 'express';
import prisma from '../prisma.js';

// District type enum
enum DistrictType {
  RURAL = 'RURAL',
  URBAN = 'URBAN'
}


// Updated BlockInput – now uses districtId instead of districtName/serialNo
interface BlockInput {
  districtId: number; 
  name: string;
  data: any;
}

// DistrictInput
interface DistrictInput {
  name: string;
  type: any;
  serialNo?: number | null;
}

// Bulk districts creation
export const createDistricts = async (req: Request, res: Response) => {
  try {
    const districtsData = req.body;

    if (!Array.isArray(districtsData) || districtsData.length === 0) {
      return res.status(400).json({
        error: "Invalid input: expected a non-empty array of districts",
      });
    }

    // ✅ Keep only valid records
    const validDistricts = districtsData.filter(
      (d) => d.name && d.type
    );

    if (validDistricts.length === 0) {
      return res.status(400).json({ error: "No valid districts found" });
    }

    // ✅ Bulk insert (ignores duplicates automatically)
    const result = await prisma.district.createMany({
      data: validDistricts.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        serialNo: d.serialNo ?? null,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({
      message: "Districts inserted successfully",
      insertedCount: result.count,
    });
  } catch (error) {
    console.error("❌ Error creating districts:", error);
    res.status(500).json({ error: "Failed to create districts" });
  } 
};





// GET blocks by district ID
export const getBlocksByDistrict = async (req: Request, res: Response) => {
  try {
    const { districtId } = req.params;

    if (!districtId) {
      return res.status(400).json({ error: 'District ID is required' });
    }

    const blocks = await prisma.block_vd.findMany({
      where: { districtId: parseInt(districtId) },
      orderBy: { block_name: 'asc' }, // Sort blocks alphabetically
    });

    if (blocks.length === 0) {
      return res.status(404).json({ message: 'No blocks found for this district' });
    }

    res.status(200).json({ data: blocks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  } finally {
    await prisma.$disconnect();
  }
};


// GET all districts
export const getAllDistricts = async (req: Request, res: Response) => {
  try {
    const { type } = req.query; // e.g., 'RURAL' or 'URBAN'
    // console.log("type is ",type)

    const whereClause: any = {};
    if (type && Object.values(DistrictType).includes(type as DistrictType)) {
      whereClause.type = type as DistrictType;
    }

    const districts = await prisma.district.findMany({
      where: whereClause,
      // include: {
      //   blocks: true, // Optional: include related blocks
      // },
      orderBy: { id: 'asc' }, // Optional: sort by serialNo
    });
   
    res.status(200).json({ data: districts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch districts' });
  } finally {
    await prisma.$disconnect();
  }
};

// GET single district by ID
export const getDistrict = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'District ID is required' });
    }

    const district = await prisma.district.findUnique({
      where: { id: parseInt(id) },
      include: { blocks: true }, // Optional: include related blocks
    });

    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }

    res.status(200).json({ data: district });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch district' });
  } finally {
    await prisma.$disconnect();
  }
};



export const createBlocks = async (req: Request, res: Response) => {

  try {

    const blocksData: BlockInput[] = req.body;
    
  } catch (error) {
    
    console.error("❌ Error creating blocks:", error);
    res.status(500).json({ error: "Failed to create blocks" });
  }
}