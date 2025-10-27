import { Request, Response } from 'express';
import prisma from '../prisma';
import { DistrictType } from '@prisma/client';

// Updated BlockInput – now uses districtId instead of districtName/serialNo
interface BlockInput {
  districtId: number; // Must reference an existing district
  name: string;
  totalData: number;
  blockPercentage: number;
  surveyData: number;
  surveyPercentage: number;
}

// DistrictInput
interface DistrictInput {
  name: string;
  type: DistrictType;
  serialNo?: number | null;
}

// Single district creation
export const createDistrict = async (req: Request, res: Response) => {
  try {
    const { name, type, serialNo } = req.body as DistrictInput;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    // Check for duplicate name
    const existing = await prisma.district.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: 'District with this name already exists' });
    }

    const district = await prisma.district.create({
      data: {
        name,
        type,
        serialNo,
      },
    });

    res.status(201).json({ message: 'District created successfully', data: district });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create district' });
  } finally {
    await prisma.$disconnect();
  }
};

// Bulk districts creation
export const createDistricts = async (req: Request, res: Response) => {
  try {
    const districtsData: DistrictInput[] = req.body;

    if (!Array.isArray(districtsData) || districtsData.length === 0) {
      return res.status(400).json({ error: 'Invalid input: expected non-empty array of districts' });
    }

    const createdDistricts = [];
    for (const input of districtsData) {
      const { name, type, serialNo } = input;

      if (!name || !type) {
        throw new Error(`Invalid data for district ${name}: name and type required`);
      }

      const district = await prisma.district.upsert({
        where: { name },
        update: { type, serialNo },
        create: { name, type, serialNo },
      });

      createdDistricts.push(district);
    }

    res.status(201).json({ message: 'Districts created/updated successfully', data: createdDistricts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create districts' });
  } finally {
    await prisma.$disconnect();
  }
};

// Single block creation – validates district exists
export const createBlock = async (req: Request, res: Response) => {
  try {   
    const {
      districtId,
      name,
      totalData,
      blockPercentage,
      surveyData,
      surveyPercentage,
    } = req.body as BlockInput;

    if (!districtId || !name) {
      return res.status(400).json({ error: 'districtId and name are required' });
    }

    // Validate district exists
    const district = await prisma.district.findUnique({ where: { id: districtId } });
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }

    // Check for duplicate block in this district
    const existingBlock = await prisma.block.findUnique({
      where: { name_districtId: { name, districtId } },
    });

    if (existingBlock) {
      return res.status(409).json({ error: 'Block with this name already exists in the district' });
    }

    const block = await prisma.block.create({
      data: {
        name,
        totalData,
        blockPercentage,
        surveyData,
        surveyPercentage,
        districtId,
      },
    });

    res.status(201).json({ message: 'Block created successfully', data: block });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create block' });
  } finally {
    await prisma.$disconnect();
  }
};

// Bulk blocks creation – validates each district exists
export const createBlocks = async (req: Request, res: Response) => {
  try {
    const blocksData: BlockInput[] = req.body;

    if (!Array.isArray(blocksData) || blocksData.length === 0) {
      return res.status(400).json({ error: 'Invalid input: expected non-empty array of blocks' });
    }

    // Pre-validate all districts exist
    const districtIds = [...new Set(blocksData.map(b => b.districtId))];
    const districts = await prisma.district.findMany({
      where: { id: { in: districtIds } },
    });
    const existingDistrictIds = districts.map(d => d.id);
    const missingIds = districtIds.filter(id => !existingDistrictIds.includes(id));
    if (missingIds.length > 0) {
      return res.status(404).json({ error: `Districts not found: ${missingIds.join(', ')}` });
    }

    const createdBlocks = await Promise.all(
      blocksData.map(async (input) => {
        const { districtId, name, totalData, blockPercentage, surveyData, surveyPercentage } = input;

        // Upsert to handle updates
        const block = await prisma.block.upsert({
          where: { name_districtId: { name, districtId } },
          update: {
            totalData,
            blockPercentage,
            surveyData,
            surveyPercentage,
          },
          create: {
            name,
            totalData,
            blockPercentage,
            surveyData,
            surveyPercentage,
            districtId,
          },
        });

        return block;
      })
    );

    res.status(201).json({ message: 'Blocks created/updated successfully', data: createdBlocks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create blocks' });
  } finally {
    await prisma.$disconnect();
  }
};

// GET single block by ID (unchanged)
export const getBlock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Block ID is required' });
    }

    const block = await prisma.block.findUnique({
      where: { id: parseInt(id) },
      include: { district: true },
    });

    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.status(200).json({ data: block });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch block' });
  } finally {
    await prisma.$disconnect();
  }
};

// GET blocks by district ID
export const getBlocksByDistrict = async (req: Request, res: Response) => {
  try {
    const { districtId } = req.params;

    if (!districtId) {
      return res.status(400).json({ error: 'District ID is required' });
    }

    const blocks = await prisma.block.findMany({
      where: { districtId: parseInt(districtId) },
      orderBy: { name: 'asc' }, // Sort blocks alphabetically
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
    console.log("type is ",type)

    const whereClause: any = {};
    if (type && Object.values(DistrictType).includes(type as DistrictType)) {
      whereClause.type = type as DistrictType;
    }

    const districts = await prisma.district.findMany({
      where: whereClause,
      include: {
        blocks: true, // Optional: include related blocks
      },
      orderBy: { serialNo: 'asc' }, // Optional: sort by serialNo
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