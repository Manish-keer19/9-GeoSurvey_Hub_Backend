import { Request, Response } from "express";
import prisma from "../prisma.js";


type DistrictType = "R" | "U";

// ✅ Get all districts
export const getAllDistricts = async (req: Request, res: Response) => {
  try {
    const districts = await prisma.district.findMany({
     
    });

    res.status(200).json({ success: true, data: districts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get districts by type (R or U)
export const getDistrictsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!["R", "U"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Use 'R' for Rural or 'U' for Urban.",
      });
    }

    const districts = await prisma.district.findMany({
      where: {
        districtblockmap: {
          some: {
            block_vd: { Block_Type: type as DistrictType },
          },
        },
      },
      include: {
        districtblockmap: {
          include: {
            block_vd: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, data: districts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get a single district and its blocks
export const getDistrictWithBlocks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const districtId = parseInt(id);

    const district = await prisma.district.findUnique({
      where: { district_id: districtId },
      include: {
        districtblockmap: {
          include: {
            block_vd: true,
          },
        },
      },
    });

    if (!district) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    res.status(200).json({ success: true, data: district });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
