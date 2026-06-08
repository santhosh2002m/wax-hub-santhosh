import { Transaction } from "sequelize";
import UserGuide from "../models/userGuideModel";

const BATCH_SIZE = 100;
const MAX_LETTER_INDEX = 25; // A through Z

export function generateGuideUid(sequenceNumber: number): string {
  if (sequenceNumber < 1) {
    throw new Error("Guide sequence number must be at least 1");
  }

  const letterIndex = Math.floor((sequenceNumber - 1) / BATCH_SIZE);
  if (letterIndex > MAX_LETTER_INDEX) {
    throw new Error("Maximum guide capacity reached (A1-Z100)");
  }

  const letter = String.fromCharCode(65 + letterIndex);
  const numberInBatch = ((sequenceNumber - 1) % BATCH_SIZE) + 1;

  return `${letter}${numberInBatch}`;
}

export async function getNextGuideUid(
  transaction?: Transaction
): Promise<string> {
  const maxId = (await UserGuide.max("id", { transaction })) as number | null;
  const nextSequence = (maxId || 0) + 1;
  return generateGuideUid(nextSequence);
}
