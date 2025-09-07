import InvoiceCounter from "../models/InvoiceCounter";

export class InvoiceNumberGenerator {
  static async getNextInvoiceNumber(
    isSpecial: boolean = false
  ): Promise<number> {
    let counter = await InvoiceCounter.findOne();

    if (!counter) {
      // Create a new counter if it doesn't exist
      counter = await InvoiceCounter.create({
        last_user_invoice: 0,
        last_special_invoice: 0,
      });
    }

    let nextNumber: number;

    if (isSpecial) {
      // Special invoices continue from the global sequence
      const globalLast = Math.max(
        counter.last_user_invoice,
        counter.last_special_invoice
      );
      nextNumber = globalLast + 1;
      await counter.update({ last_special_invoice: nextNumber });
    } else {
      // User invoices continue from the global sequence
      const globalLast = Math.max(
        counter.last_user_invoice,
        counter.last_special_invoice
      );
      nextNumber = globalLast + 1;
      await counter.update({ last_user_invoice: nextNumber });
    }

    return nextNumber;
  }

  static async getAdminInvoiceNumber(): Promise<number> {
    const counter = await InvoiceCounter.findOne();
    if (!counter) return 1;

    // Admin dashboard only counts user invoices sequentially
    return counter.last_user_invoice + 1;
  }

  static async getCurrentCounts(): Promise<{ user: number; special: number }> {
    const counter = await InvoiceCounter.findOne();
    return {
      user: counter ? counter.last_user_invoice : 0,
      special: counter ? counter.last_special_invoice : 0,
    };
  }

  static async resetCounters(): Promise<void> {
    const counter = await InvoiceCounter.findOne();
    if (counter) {
      await counter.update({
        last_user_invoice: 0,
        last_special_invoice: 0,
      });
    } else {
      await InvoiceCounter.create({
        last_user_invoice: 0,
        last_special_invoice: 0,
      });
    }
  }
}
