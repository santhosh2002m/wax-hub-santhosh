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
      // Special invoices continue from last user invoice count
      nextNumber = counter.last_user_invoice + 1;
      await counter.update({ last_special_invoice: nextNumber });
    } else {
      // User invoices continue from combined count
      const combinedLast = Math.max(
        counter.last_user_invoice,
        counter.last_special_invoice
      );
      nextNumber = combinedLast + 1;
      await counter.update({ last_user_invoice: nextNumber });
    }

    return nextNumber;
  }

  static async getCurrentUserInvoiceCount(): Promise<number> {
    const counter = await InvoiceCounter.findOne();
    return counter ? counter.last_user_invoice : 0;
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
