import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Absences
export const getAbsences = () => axios.get(`${API}/absences`);
export const getMyAbsences = () => axios.get(`${API}/absences/my`);
export const getPendingAbsences = () => axios.get(`${API}/absences/pending`);
export const createAbsence = (data) => axios.post(`${API}/absences`, data);
export const handleAbsenceAction = (absenceId, action, reason) =>
  axios.put(`${API}/absences/${absenceId}/action`, { action, reason });
export const deleteAbsence = (absenceId) => axios.delete(`${API}/absences/${absenceId}`);

// Users
export const getUsers = () => axios.get(`${API}/users`);
export const getUser = (userId) => axios.get(`${API}/users/${userId}`);
export const updateUser = (userId, data) => axios.put(`${API}/users/${userId}`, data);
export const deleteUser = (userId) => axios.delete(`${API}/users/${userId}`);

// Settings
export const getSettings = () => axios.get(`${API}/settings`);
export const updateSettings = (data) => axios.put(`${API}/settings`, data);
export const uploadLogo = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${API}/settings/logo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Stats
export const getStats = () => axios.get(`${API}/stats`);
