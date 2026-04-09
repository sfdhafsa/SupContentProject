import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const UserLibrary = sequelize.define(
  "UserLibrary",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    movie_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [["TO_WATCH", "IN_PROGRESS", "COMPLETED", "DROPPED"]],
      },
    },
    started_at: {
      type: DataTypes.DATE,
    },
    completed_at: {
      type: DataTypes.DATE,
    },
    last_interaction_at: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "user_library",
    timestamps: false,
  }
);

export default UserLibrary;