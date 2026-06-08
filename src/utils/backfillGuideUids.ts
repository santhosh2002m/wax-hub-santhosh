import { Op } from "sequelize";
import UserGuide from "../models/userGuideModel";
import { generateGuideUid } from "./generateGuideUid";

export async function backfillGuideUids(): Promise<number> {
  const guides = await UserGuide.findAll({
    where: {
      [Op.or]: [{ uid: null as any }, { uid: "" }],
    },
    order: [["id", "ASC"]],
  });

  if (guides.length === 0) {
    const allGuides = await UserGuide.findAll({ order: [["id", "ASC"]] });
    const missing = allGuides.filter((g) => !g.uid?.trim());
    if (missing.length === 0) {
      console.log("All guides already have UIDs");
      return 0;
    }

    for (let i = 0; i < missing.length; i++) {
      const guide = missing[i];
      const uid = generateGuideUid(guide.id);
      guide.uid = uid;
      await guide.save();
      console.log(`Assigned ${uid} to guide #${guide.id} (${guide.name})`);
    }
    return missing.length;
  }

  for (let i = 0; i < guides.length; i++) {
    const guide = guides[i];
    const uid = generateGuideUid(guide.id);
    guide.uid = uid;
    await guide.save();
    console.log(`Assigned ${uid} to guide #${guide.id} (${guide.name})`);
  }

  return guides.length;
}
