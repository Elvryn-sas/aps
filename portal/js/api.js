// js/api.js — All API calls to your PC backend. Replaces firebase.js + db.js
import { SCHOOL_CONFIG } from "../config.js";

const BASE = () => SCHOOL_CONFIG.backendUrl;

// ── Token storage ─────────────────────────────────────────────────────────
function getToken()        { return sessionStorage.getItem("aps_token"); }
function setToken(t)       { sessionStorage.setItem("aps_token", t); }
function clearToken()      { sessionStorage.removeItem("aps_token"); }
function getStoredUser()   { return JSON.parse(sessionStorage.getItem("aps_user") || "null"); }
function setStoredUser(u)  { sessionStorage.setItem("aps_user", JSON.stringify(u)); }
function clearStoredUser() { sessionStorage.removeItem("aps_user"); }

// ── Core fetch wrapper ────────────────────────────────────────────────────
async function api(method, path, body = null, isForm = false) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (!isForm) headers["Content-Type"] = "application/json";

  const opts = { method, headers };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  const res  = await fetch(`${BASE()}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ══════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════

export async function login(email, password, role) {
  const data = await api("POST", "/api/auth/login", { email, password, role });
  setToken(data.token);
  setStoredUser(data.user);
  return data.user;
}

export async function logout() {
  clearToken();
  clearStoredUser();
}

export async function getMe() {
  return api("GET", "/api/auth/me");
}

/** Returns current user from session storage (no network call). Null if not logged in. */
export function getCurrentUser() {
  return getStoredUser();
}

/** Check if a valid session token exists, verify with server */
export async function checkAuth() {
  if (!getToken()) return null;
  try {
    const data = await getMe();
    // getMe returns { user: {...} } — unwrap the user object
    const user = data.user || data;
    setStoredUser(user);
    return user;
  } catch {
    clearToken();
    clearStoredUser();
    return null;
  }
}

export async function setupAdmin(name, email, password, setupKey) {
  const data = await api("POST", "/api/auth/setup", { name, email, password, setupKey });
  setToken(data.token);
  setStoredUser(data.user);
  return data.user;
}

// ══════════════════════════════════════════════════════════════════════════
// CLASSES
// ══════════════════════════════════════════════════════════════════════════

export async function getClasses() {
  return api("GET", "/api/classes");
}

export async function getClass(id) {
  const classes = await getClasses();
  return classes.find(c => c.id === id) || null;
}

export async function addClass(data) {
  return api("POST", "/api/classes", data);
}

export async function updateClass(id, data) {
  return api("PUT", `/api/classes/${id}`, data);
}

export async function deleteClass(id) {
  return api("DELETE", `/api/classes/${id}`);
}

// ══════════════════════════════════════════════════════════════════════════
// TEACHERS
// ══════════════════════════════════════════════════════════════════════════

export async function getTeachers() {
  return api("GET", "/api/teachers");
}

export async function createTeacher(name, email, password, subject) {
  return api("POST", "/api/teachers", { name, email, password, subject });
}

export async function deleteTeacher(id) {
  return api("DELETE", `/api/teachers/${id}`);
}

export async function assignTeacherClasses(teacherId, classIds) {
  return api("PUT", `/api/teachers/${teacherId}/classes`, { classIds });
}

// ══════════════════════════════════════════════════════════════════════════
// STUDENTS
// ══════════════════════════════════════════════════════════════════════════

export async function getAllStudents() {
  return api("GET", "/api/students");
}

export async function getStudentsByClass(classId) {
  return api("GET", `/api/students?classId=${classId}`);
}

export async function getStudentsByClassIds(classIds) {
  if (!classIds || !classIds.length) return [];
  return api("GET", `/api/students?classIds=${classIds.join(",")}`);
}

export async function addStudent(data) {
  return api("POST", "/api/students", data);
}

/**
 * Upload an Excel file for a class.
 * @param {File} file - The .xlsx file
 * @param {string} classId
 */
export async function bulkUploadStudents(file, classId) {
  const form = new FormData();
  form.append("file", file);
  form.append("classId", classId);
  return api("POST", "/api/students/bulk", form, true);
}

// ══════════════════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════════════════

export async function getAllResults() {
  return api("GET", "/api/results");
}

export async function getResultsByClass(classId) {
  return api("GET", `/api/results?classId=${classId}`);
}

export async function getResult(studentId, term) {
  return api("GET", `/api/results/${studentId}/${encodeURIComponent(term)}`);
}

export async function saveResult(data) {
  return api("POST", "/api/results", data);
}
