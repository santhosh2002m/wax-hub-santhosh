// FILE: utils/invoiceNumberGenerator.ts
import InvoiceCounter from "../models/InvoiceCounter";
import Transaction from "../models/transactionModel";
import UserTicket from "../models/userticketModel";
import { Op } from "sequelize";
import sequelize from "../config/database";

interface MaxInvoiceResult {
  max_invoice: string | null;
}

export class InvoiceNumberGenerator {
  static async getNextInvoiceNumber(
    isSpecial: boolean = false
  ): Promise<string> {
    if (isSpecial) {
      // SPECIAL USER: Always return the last normal user invoice number AS STRING
      const lastNumber = await this.getLastNormalInvoiceNumber();
      return lastNumber.toString();
    } else {
      // NORMAL USER: Increment as usual
      const nextNumber = await this.getNextNormalInvoiceNumber();
      return nextNumber.toString();
    }
  }

  private static async getLastNormalInvoiceNumber(): Promise<number> {
    try {
      console.log("Finding last normal invoice number...");

      // Method 1: Get the last normal user ticket invoice number (most reliable)
      const lastUserTicket = await UserTicket.findOne({
        where: {
          invoice_no: {
            [Op.notLike]: "SPT%", // Exclude special tickets
            [Op.regexp]: "^[0-9]+$", // Only numeric invoice numbers
          },
        },
        order: [["createdAt", "DESC"]],
        attributes: ["invoice_no"],
      });

      if (lastUserTicket && lastUserTicket.invoice_no) {
        const invoiceNumber = parseInt(lastUserTicket.invoice_no);
        if (!isNaN(invoiceNumber)) {
          console.log(
            `Found last normal invoice from UserTicket: ${invoiceNumber}`
          );
          return invoiceNumber;
        }
      }

      // Method 2: Get from transactions as fallback
      const lastTransaction = await Transaction.findOne({
        where: {
          invoice_no: {
            [Op.notLike]: "SPT%", // Exclude special tickets
            [Op.regexp]: "^[0-9]+$", // Only numeric invoice numbers
          },
        },
        order: [["createdAt", "DESC"]],
        attributes: ["invoice_no"],
      });

      if (lastTransaction && lastTransaction.invoice_no) {
        const invoiceNumber = parseInt(lastTransaction.invoice_no);
        if (!isNaN(invoiceNumber)) {
          console.log(
            `Found last normal invoice from Transaction: ${invoiceNumber}`
          );
          return invoiceNumber;
        }
      }

      // Method 3: Get highest numeric invoice number
      const highestTransaction = (await Transaction.findOne({
        attributes: [
          [
            sequelize.fn(
              "MAX",
              sequelize.cast(sequelize.col("invoice_no"), "INTEGER")
            ),
            "max_invoice",
          ],
        ],
        where: {
          invoice_no: {
            [Op.notLike]: "SPT%",
            [Op.regexp]: "^[0-9]+$",
          },
        },
        raw: true,
      })) as unknown as MaxInvoiceResult;

      if (highestTransaction?.max_invoice) {
        const invoiceNumber = parseInt(highestTransaction.max_invoice);
        console.log(`Found highest normal invoice: ${invoiceNumber}`);
        return invoiceNumber;
      }

      // Default fallback - get from your current data
      console.log("No normal invoices found, using fallback: 6878");
      return 6878;
    } catch (error) {
      console.error("Error getting last normal invoice number:", error);
      return 6878; // Fallback to current last number
    }
  }

  private static async getNextNormalInvoiceNumber(): Promise<number> {
    try {
      // Get the last normal invoice number
      const lastNumber = await this.getLastNormalInvoiceNumber();

      // Increment for normal users
      const nextNumber = lastNumber + 1;
      console.log(`Normal user incrementing to: ${nextNumber}`);

      return nextNumber;
    } catch (error) {
      console.error("Error getting next normal invoice number:", error);
      const lastNumber = await this.getLastNormalInvoiceNumber();
      return lastNumber + 1;
    }
  }

  static async getAdminInvoiceNumber(): Promise<string> {
    const nextNumber = await this.getNextNormalInvoiceNumber();
    return nextNumber.toString();
  }

  static async getCurrentCounts(): Promise<{ user: string; special: string }> {
    const lastNormal = await this.getLastNormalInvoiceNumber();
    return {
      user: (lastNormal + 1).toString(), // Next number for normal users
      special: lastNormal.toString(), // Special users reuse the last normal number
    };
  }

  // ADD THIS METHOD - Reset counters based on current data
  static async resetCounters(): Promise<void> {
    try {
      const lastNormal = await this.getLastNormalInvoiceNumber();
      console.log(`Resetting counters to: ${lastNormal}`);

      const counter = await InvoiceCounter.findOne();
      if (counter) {
        await counter.update({
          last_user_invoice: lastNormal,
          last_special_invoice: lastNormal,
        });
        console.log("Counters updated successfully");
      } else {
        await InvoiceCounter.create({
          last_user_invoice: lastNormal,
          last_special_invoice: lastNormal,
        });
        console.log("New counters created successfully");
      }
    } catch (error) {
      console.error("Error resetting counters:", error);
      throw error;
    }
  }

  // ADD THIS METHOD - Get current invoice status
  static async getInvoiceStatus(): Promise<{
    lastNormalInvoice: number;
    nextNormalInvoice: number;
    specialInvoice: number;
  }> {
    const lastNormal = await this.getLastNormalInvoiceNumber();
    return {
      lastNormalInvoice: lastNormal,
      nextNormalInvoice: lastNormal + 1,
      specialInvoice: lastNormal,
    };
  }
}
