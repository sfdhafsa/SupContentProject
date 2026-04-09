import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const tmdb = axios.create({
  baseURL: process.env.TMDB_BASE_URL,
  params: {
    api_key: process.env.TMDB_API_KEY,
  },
});

export default tmdb;