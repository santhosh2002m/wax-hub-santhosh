import { Request, Response } from "express";
import Message from "../models/messageModel";
import Counter from "../models/counterModel"; // Added import
import { messageSchema } from "../schemas/messageSchema";

export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await Message.findAll({
      include: [{ model: Counter, as: "counter" }],
    });
    res.json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addMessage = async (req: Request, res: Response) => {
  try {
    const { error } = messageSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const user = (req as any).user as { id: number; username: string };
    const message = await Message.create({ ...req.body, counter_id: user.id });
    res
      .status(201)
      .json({ message: "Message created successfully", data: message });
  } catch (error) {
    console.error("Error in addMessage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = await Message.findByPk(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    await message.destroy();
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
