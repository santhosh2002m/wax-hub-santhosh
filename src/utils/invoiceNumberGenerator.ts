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
          last_user_invoice: 6878,
          last_special_invoice: 6878,
        });
        console.log("Created new invoice counter with default values");
      }

      if (isSpecial) {
        // SPECIAL USER: Continue from last_special_invoice + 1
        const nextSpecialNumber = counter.last_special_invoice + 1;

        // Update the special counter to continue sequentially
        await counter.update({
          last_special_invoice: nextSpecialNumber,
        });

        console.log(
          `Special user invoice: ${nextSpecialNumber} (continues from special counter)`
        );
        return nextSpecialNumber.toString();
      } else {
        // NORMAL USER: Increment and return
        const nextNumber = counter.last_user_invoice + 1;

        // Update the normal counter (this updates admin panel)
        await counter.update({
          last_user_invoice: nextNumber,
          // When normal user creates ticket, sync special counter to match
          last_special_invoice: nextNumber,
        });

        console.log(
          `Normal user invoice: ${nextNumber} (updated both counters)`
        );
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
        last_special_invoice: nextNumber, // Also sync special counter
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
        special: (counter.last_special_invoice + 1).toString(), // Next number for special users
      };
    } catch (error) {
      console.error("Error getting current counts:", error);
      return {
        user: "6879", // Fallback
        special: "6879",
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
    lastSpecialInvoice: number;
    nextSpecialInvoice: number;
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
        lastSpecialInvoice: counter.last_special_invoice,
        nextSpecialInvoice: counter.last_special_invoice + 1,
      };
    } catch (error) {
      console.error("Error getting invoice status:", error);
      return {
        lastNormalInvoice: 6878,
        nextNormalInvoice: 6879,
        lastSpecialInvoice: 6878,
        nextSpecialInvoice: 6879,
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

  // NEW: Fix your current database state
  static async fixCurrentState(): Promise<void> {
    try {
      let counter = await InvoiceCounter.findOne();

      if (!counter) {
        return;
      }

      // Sync special counter to match normal counter
      await counter.update({
        last_special_invoice: counter.last_user_invoice,
      });

      console.log(
        `Fixed counters - Normal: ${counter.last_user_invoice}, Special: ${counter.last_user_invoice}`
      );
    } catch (error) {
      console.error("Error fixing current state:", error);
    }
  }
}
