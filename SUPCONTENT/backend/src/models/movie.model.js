import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Movie = sequelize.define(
  "Movie",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    external_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    source_api: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "tmdb",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    overview: {
      type: DataTypes.TEXT,
    },
    poster_url: {
      type: DataTypes.STRING(500),
    },
    release_date: {
      type: DataTypes.DATEONLY,
    },
    runtime_minutes: {
      type: DataTypes.INTEGER,
    },
    cached_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "movies",
    timestamps: false,
  }
);

export default Movie;