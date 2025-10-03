// FILE: utils/invoiceNumberGenerator.ts
import InvoiceCounter from "../models/InvoiceCounter";
import { Op } from "sequelize";

export class InvoiceNumberGenerator {
  static async getNextInvoiceNumber(
    isSpecial: boolean = false
  ): Promise<string> {
    try {
      // Get or create the counter record
      let counter = await InvoiceCounter.findOne();

      if (!counter) {
        // Initialize with default values if counter doesn't exist
        counter = await InvoiceCounter.create({
          last_user_invoice: 6878, // Your current last number
          last_special_invoice: 6878,
        });
        console.log("Created new invoice counter with default values");
      }

      if (isSpecial) {
        // SPECIAL USER: Return the last normal user invoice number
        const specialInvoice = counter.last_user_invoice.toString();
        console.log(`Special user invoice: ${specialInvoice}`);
        return specialInvoice;
      } else {
        // NORMAL USER: Increment and return
        const nextNumber = counter.last_user_invoice + 1;

        // Update the counter
        await counter.update({
          last_user_invoice: nextNumber,
        });

        console.log(`Normal user invoice: ${nextNumber}`);
        return nextNumber.toString();
      }
    } catch (error) {
      console.error("Error generating invoice number:", error);
      throw error;
    }
  }

  static async getAdminInvoiceNumber(): Promise<string> {
    try {
      let counter = await InvoiceCounter.findOne();

      if (!counter) {
        counter = await InvoiceCounter.create({
          last_user_invoice: 6878,
          last_special_invoice: 6878,
        });
      }

      const nextNumber = counter.last_user_invoice + 1;

      // Update the counter for admin as well
      await counter.update({
        last_user_invoice: nextNumber,
      });

      return nextNumber.toString();
    } catch (error) {
      console.error("Error getting admin invoice number:", error);
      throw error;
    }
  }

  static async getCurrentCounts(): Promise<{ user: string; special: string }> {
    try {
      let counter = await InvoiceCounter.findOne();

      if (!counter) {
        counter = await InvoiceCounter.create({
          last_user_invoice: 6878,
          last_special_invoice: 6878,
        });
      }

      return {
        user: (counter.last_user_invoice + 1).toString(), // Next number for normal users
        special: counter.last_user_invoice.toString(), // Special users reuse the last normal number
      };
    } catch (error) {
      console.error("Error getting current counts:", error);
      return {
        user: "6879", // Fallback
        special: "6878",
      };
    }
  }

  static async resetCounters(): Promise<void> {
    try {
      // Find the highest invoice number from existing data to reset to
      const lastNormal = await this.getLastNormalInvoiceNumberFromData();

      let counter = await InvoiceCounter.findOne();
      if (counter) {
        await counter.update({
          last_user_invoice: lastNormal,
          last_special_invoice: lastNormal,
        });
        console.log(`Counters reset to: ${lastNormal}`);
      } else {
        await InvoiceCounter.create({
          last_user_invoice: lastNormal,
          last_special_invoice: lastNormal,
        });
        console.log(`New counters created with: ${lastNormal}`);
      }
    } catch (error) {
      console.error("Error resetting counters:", error);
      throw error;
    }
  }

  static async getInvoiceStatus(): Promise<{
    lastNormalInvoice: number;
    nextNormalInvoice: number;
    specialInvoice: number;
  }> {
    try {
      let counter = await InvoiceCounter.findOne();

      if (!counter) {
        counter = await InvoiceCounter.create({
          last_user_invoice: 6878,
          last_special_invoice: 6878,
        });
      }

      return {
        lastNormalInvoice: counter.last_user_invoice,
        nextNormalInvoice: counter.last_user_invoice + 1,
        specialInvoice: counter.last_user_invoice, // Special uses last normal
      };
    } catch (error) {
      console.error("Error getting invoice status:", error);
      return {
        lastNormalInvoice: 6878,
        nextNormalInvoice: 6879,
        specialInvoice: 6878,
      };
    }
  }

  // Helper method to get the last normal invoice number from actual data
  // Used only for resetting purposes
  private static async getLastNormalInvoiceNumberFromData(): Promise<number> {
    try {
      // You can keep this method for reset functionality, but it won't be used in normal flow
      // This would query your transactions/tickets tables to find the highest invoice number
      // For now, returning a default
      return 6878;
    } catch (error) {
      console.error("Error getting last normal invoice from data:", error);
      return 6878;
    }
  }

  // Method to manually set counters (useful for admin purposes)
  static async setCounterManually(
    userInvoice: number,
    specialInvoice?: number
  ): Promise<void> {
    try {
      let counter = await InvoiceCounter.findOne();

      if (counter) {
        await counter.update({
          last_user_invoice: userInvoice,
          last_special_invoice: specialInvoice || userInvoice,
        });
      } else {
        await InvoiceCounter.create({
          last_user_invoice: userInvoice,
          last_special_invoice: specialInvoice || userInvoice,
        });
      }

      console.log(
        `Counters set manually - User: ${userInvoice}, Special: ${
          specialInvoice || userInvoice
        }`
      );
    } catch (error) {
      console.error("Error setting counters manually:", error);
      throw error;
    }
  }
}
