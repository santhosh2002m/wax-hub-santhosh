// FILE: controllers/guideController.ts
import { Request, Response } from "express";
import UserGuide from "../models/userGuideModel";
import { guideSchema } from "../schemas/guideSchema";

export const getGuides = async (req: Request, res: Response) => {
  try {
    const guides = await UserGuide.findAll();
    res.json(guides);
  } catch (error) {
    console.error("Error in getGuides:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addGuide = async (req: Request, res: Response) => {
  try {
    const { error } = guideSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const guide = await UserGuide.create(req.body);
    res.status(201).json(guide);
  } catch (error) {
    console.error("Error in addGuide:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGuide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = guideSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const guide = await UserGuide.findByPk(id);
    if (!guide) return res.status(404).json({ message: "Guide not found" });

    await UserGuide.update(req.body, { where: { id } });
    res.json({ message: "Guide updated" });
  } catch (error) {
    console.error("Error in updateGuide:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGuide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guide = await UserGuide.findByPk(id);
    if (!guide) return res.status(404).json({ message: "Guide not found" });

    await UserGuide.destroy({ where: { id } });
    res.json({ message: "Guide deleted" });
  } catch (error) {
    console.error("Error in deleteGuide:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
