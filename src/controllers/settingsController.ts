import { Request, Response } from "express";
import InvoiceCounter from "../models/InvoiceCounter";

export const getCounterSettings = async (req: Request, res: Response) => {
  try {
    let counter = await InvoiceCounter.findOne();
    if (!counter) {
      counter = await InvoiceCounter.create({
        last_user_invoice: 6878,
        last_special_invoice: 6878,
      });
    }

    res.json({
      reset_date: counter.reset_date,
      has_reset_occurred: counter.has_reset_occurred,
      current_year_prefix: counter.current_year_prefix,
    });
  } catch (error) {
    console.error("Error getting counter settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCounterSettings = async (req: Request, res: Response) => {
  try {
    const { reset_date, current_year_prefix } = req.body;

    let counter = await InvoiceCounter.findOne();
    if (!counter) {
      counter = await InvoiceCounter.create({
        last_user_invoice: 6878,
        last_special_invoice: 6878,
      });
    }

    // Only set has_reset_occurred to false if the reset_date has actually changed
    // or if they are manually re-arming it.
    let hasReset = counter.has_reset_occurred;
    const newResetDate = reset_date ? new Date(reset_date) : null;
    
    if (newResetDate && counter.reset_date) {
        if (newResetDate.getTime() !== counter.reset_date.getTime()) {
            hasReset = false; // Arm the new reset date
        }
    } else if (newResetDate && !counter.reset_date) {
        hasReset = false;
    }

    await counter.update({
      reset_date: newResetDate,
      current_year_prefix: current_year_prefix || "",
      has_reset_occurred: hasReset,
    });

    res.json({
      message: "Counter settings updated successfully",
      settings: {
        reset_date: counter.reset_date,
        has_reset_occurred: counter.has_reset_occurred,
        current_year_prefix: counter.current_year_prefix,
      },
    });
  } catch (error) {
    console.error("Error updating counter settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
