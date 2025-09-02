declare module "luxon" {
  export class DateTime {
    static now(): DateTime;
    static fromJSDate(date: Date): DateTime;

    startOf(unit: string): DateTime;
    endOf(unit: string): DateTime;
    minus(duration: object): DateTime;
    toJSDate(): Date;
    toISO(): string;

    // Add other methods you use
  }

  // Add other exports you use from luxon
}
