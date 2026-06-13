import api from '../config/api';

export const getListById = async (listId) => {
  const response = await api.get(`/lists/${listId}`);
  return response.data?.data || response.data;
};
