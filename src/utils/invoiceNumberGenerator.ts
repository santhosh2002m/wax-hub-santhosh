// FILE: utils/invoiceNumberGenerator.ts
import InvoiceCounter from "../models/InvoiceCounter";
import Transaction from "../models/transactionModel";
import { Op } from "sequelize";
import sequelize from "../config/database";

interface MaxInvoiceResult {
  max_invoice: string | null;
}

export class InvoiceNumberGenerator {
  static async getNextInvoiceNumber(
    isSpecial: boolean = false
  ): Promise<number> {
    // First, find the highest invoice number from existing transactions
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
          [Op.notLike]: "SPT%", // Exclude special tickets
          [Op.regexp]: "^[0-9]+$", // Only numeric invoice numbers
        },
      },
      raw: true,
    })) as unknown as MaxInvoiceResult;

    // Get the current counter
    let counter = await InvoiceCounter.findOne();
    if (!counter) {
      counter = await InvoiceCounter.create({
        last_user_invoice: 0,
        last_special_invoice: 0,
      });
    }

    // Determine the next number - use the highest of existing transactions or counter
    const highestExisting = highestTransaction?.max_invoice
      ? parseInt(highestTransaction.max_invoice)
      : 0;

    const nextNumber =
      Math.max(
        highestExisting,
        counter.last_user_invoice,
        counter.last_special_invoice
      ) + 1;

    // Update the appropriate counter
    if (isSpecial) {
      await counter.update({ last_special_invoice: nextNumber });
    } else {
      await counter.update({ last_user_invoice: nextNumber });
    }

    return nextNumber;
  }

  static async getAdminInvoiceNumber(): Promise<number> {
    // Find the highest invoice number from existing transactions
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
          [Op.notLike]: "SPT%", // Exclude special tickets
          [Op.regexp]: "^[0-9]+$", // Only numeric invoice numbers
        },
      },
      raw: true,
    })) as unknown as MaxInvoiceResult;

    const counter = await InvoiceCounter.findOne();

    // Return the next number (highest existing + 1)
    const highestExisting = highestTransaction?.max_invoice
      ? parseInt(highestTransaction.max_invoice)
      : 0;

    return (
      Math.max(highestExisting, counter ? counter.last_user_invoice : 0) + 1
    );
  }

  static async getCurrentCounts(): Promise<{ user: number; special: number }> {
    // Find the highest invoice number from existing transactions
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
          [Op.notLike]: "SPT%", // Exclude special tickets
          [Op.regexp]: "^[0-9]+$", // Only numeric invoice numbers
        },
      },
      raw: true,
    })) as unknown as MaxInvoiceResult;

    const counter = await InvoiceCounter.findOne();

    const highestExisting = highestTransaction?.max_invoice
      ? parseInt(highestTransaction.max_invoice)
      : 0;

    return {
      user: Math.max(highestExisting, counter ? counter.last_user_invoice : 0),
      special: counter ? counter.last_special_invoice : 0,
    };
  }

  static async resetCounters(): Promise<void> {
    // Find the highest invoice number from existing transactions
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
          [Op.notLike]: "SPT%", // Exclude special tickets
          [Op.regexp]: "^[0-9]+$", // Only numeric invoice numbers
        },
      },
      raw: true,
    })) as unknown as MaxInvoiceResult;

    const highestExisting = highestTransaction?.max_invoice
      ? parseInt(highestTransaction.max_invoice)
      : 0;

    const counter = await InvoiceCounter.findOne();
    if (counter) {
      await counter.update({
        last_user_invoice: highestExisting,
        last_special_invoice: highestExisting,
      });
    } else {
      await InvoiceCounter.create({
        last_user_invoice: highestExisting,
        last_special_invoice: highestExisting,
      });
    }
  }
}
