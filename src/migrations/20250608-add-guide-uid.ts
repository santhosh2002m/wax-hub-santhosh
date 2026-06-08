import { QueryInterface, DataTypes } from "sequelize";

function generateGuideUid(sequenceNumber: number): string {
  const letterIndex = Math.floor((sequenceNumber - 1) / 100);
  const letter = String.fromCharCode(65 + letterIndex);
  const numberInBatch = ((sequenceNumber - 1) % 100) + 1;
  return `${letter}${numberInBatch}`;
}

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    await queryInterface.addColumn("user_guides", "uid", {
      type: Sequelize.STRING(10),
      allowNull: true,
      unique: true,
    });

    const [guides] = (await queryInterface.sequelize!.query(
      'SELECT id FROM user_guides ORDER BY id ASC'
    )) as [{ id: number }[], unknown];

    for (let i = 0; i < guides.length; i++) {
      const uid = generateGuideUid(i + 1);
      await queryInterface.sequelize!.query(
        "UPDATE user_guides SET uid = :uid WHERE id = :id",
        { replacements: { uid, id: guides[i].id } }
      );
    }

    await queryInterface.changeColumn("user_guides", "uid", {
      type: Sequelize.STRING(10),
      allowNull: false,
      unique: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("user_guides", "uid");
  },
};
