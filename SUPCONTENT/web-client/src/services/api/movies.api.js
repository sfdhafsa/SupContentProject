import api from "./axios";

export const moviesApi = {
  search: (query, page = 1, year, genre_id) => {
    const params = { q: query, page };
    if (year)     params.year     = year;
    if (genre_id) params.genre_id = genre_id;
    return api.get("/movies/search", { params });
  },

  getById: (tmdbId) => api.get(`/movies/${tmdbId}`),

  getPopular: (page = 1) => api.get("/movies/popular", { params: { page } }),

  getGenres: () => api.get("/movies/genres"),

  discover: ({ page = 1, genre_id, year_min, year_max, min_rating, sort_by } = {}) => {
    const params = { page };
    if (genre_id)   params.genre_id   = genre_id;
    if (year_min)   params.year_min   = year_min;
    if (year_max)   params.year_max   = year_max;
    if (min_rating) params.min_rating = min_rating;
    if (sort_by)    params.sort_by    = sort_by;
    return api.get("/movies/discover", { params });
  },
};