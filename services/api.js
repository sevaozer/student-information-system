// api.js
import axios from "axios";

const API_URL = "http://localhost:4000"; // Backend portu

// ----------------- GENEL CRUD -----------------
export const getAll = async (endpoint) => {
  const res = await axios.get(`${API_URL}/${endpoint}`);
  return res.data;
};

export const getById = async (endpoint, id) => {
  const res = await axios.get(`${API_URL}/${endpoint}/${id}`);
  return res.data;
};

export const createItem = async (endpoint, data) => {
  const res = await axios.post(`${API_URL}/${endpoint}`, data);
  return res.data;
};

export const updateItem = async (endpoint, id, data) => {
  const res = await axios.put(`${API_URL}/${endpoint}/${id}`, data);
  return res.data;
};

export const deleteItem = async (endpoint, id) => {
  const res = await axios.delete(`${API_URL}/${endpoint}/${id}`);
  return res.data;
};

// ----------------- ÖĞRENCİYE ÖZEL ENDPOINTLER -----------------

// Öğrencinin notlarını al
export const getGradesByStudent = async (studentId) => {
  const res = await axios.get(`${API_URL}/SectionGrades/Student/${studentId}`);
  return res.data;
};

// Öğrencinin ders programını al
export const getScheduleByStudent = async (studentId) => {
  const res = await axios.get(`${API_URL}/ClassSchedule/Student/${studentId}`);
  return res.data;
};

// Öğrencinin kayıtlı olduğu dersleri al
export const getEnrollmentsByStudent = async (studentId) => {
  const res = await axios.get(`${API_URL}/Enrollments/Student/${studentId}`);
  return res.data;
};
