import { Request, Response } from "express";
import UserGuide from "../models/userGuideModel";
import {
  userGuideSchema,
  userGuideUpdateSchema,
} from "../schemas/userGuideSchema";
import { Op } from "sequelize";

export const getUserGuides = async (req: Request, res: Response) => {
  try {
    const { search, status, vehicle_type } = req.query;
    let whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { number: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (vehicle_type) {
      whereClause.vehicle_type = vehicle_type;
    }

    const guides = await UserGuide.findAll({
      where: whereClause,
      order: [["score", "DESC"]],
    });

    res.json({
      guides: guides.map((guide) => ({
        id: guide.id,
        name: guide.name,
        number: guide.number,
        vehicle_type: guide.vehicle_type,
        score: guide.score,
        total_bookings: guide.total_bookings,
        rating: guide.rating,
        status: guide.status,
        created_at: guide.created_at,
      })),
      total: guides.length,
    });
  } catch (error) {
    console.error("Error in get user guides:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserGuide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guide = await UserGuide.findByPk(id);

    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    res.json({
      id: guide.id,
      name: guide.name,
      number: guide.number,
      vehicle_type: guide.vehicle_type,
      score: guide.score,
      total_bookings: guide.total_bookings,
      rating: guide.rating,
      status: guide.status,
      created_at: guide.created_at,
    });
  } catch (error) {
    console.error("Error in get user guide:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createUserGuide = async (req: Request, res: Response) => {
  try {
    const { error } = userGuideSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      name,
      number,
      vehicle_type,
      score,
      total_bookings,
      rating,
      status,
    } = req.body;

    const existingGuide = await UserGuide.findOne({ where: { number } });
    if (existingGuide) {
      return res
        .status(400)
        .json({ message: "Guide with this number already exists" });
    }

    const guide = await UserGuide.create({
      name,
      number,
      vehicle_type,
      score: score || 0,
      total_bookings: total_bookings || 0,
      rating: rating || 0.0,
      status: status || "active",
      created_at: new Date(), // Explicitly set created_at
      updated_at: new Date(), // Explicitly set updated_at
    });

    res.status(201).json({
      message: "Guide created successfully",
      guide: {
        id: guide.id,
        name: guide.name,
        number: guide.number,
        vehicle_type: guide.vehicle_type,
        score: guide.score,
        total_bookings: guide.total_bookings,
        rating: guide.rating,
        status: guide.status,
        created_at: guide.created_at,
      },
    });
  } catch (error) {
    console.error("Error in create user guide:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const updateUserGuide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = userGuideUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const guide = await UserGuide.findByPk(id);
    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    if (req.body.number && req.body.number !== guide.number) {
      const existingGuide = await UserGuide.findOne({
        where: { number: req.body.number },
      });
      if (existingGuide) {
        return res
          .status(400)
          .json({ message: "Another guide with this number already exists" });
      }
    }

    await guide.update(req.body);
    res.json({
      message: "Guide updated successfully",
      guide: {
        id: guide.id,
        name: guide.name,
        number: guide.number,
        vehicle_type: guide.vehicle_type,
        score: guide.score,
        total_bookings: guide.total_bookings,
        rating: guide.rating,
        status: guide.status,
        updated_at: guide.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in update user guide:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUserGuide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guide = await UserGuide.findByPk(id);
    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    await guide.destroy();
    res.json({ message: "Guide deleted successfully" });
  } catch (error) {
    console.error("Error in delete user guide:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTopPerformers = async (req: Request, res: Response) => {
  try {
    const { limit = 3 } = req.query;
    const topPerformers = await UserGuide.findAll({
      where: { status: "active" },
      order: [["score", "DESC"]],
      limit: parseInt(limit as string) || 3,
    });

    res.json({
      top_performers: topPerformers.map((guide) => ({
        id: guide.id,
        name: guide.name,
        number: guide.number,
        vehicle_type: guide.vehicle_type,
        score: guide.score,
        total_bookings: guide.total_bookings,
        rating: guide.rating,
        rank: topPerformers.indexOf(guide) + 1,
      })),
    });
  } catch (error) {
    console.error("Error in get top performers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
