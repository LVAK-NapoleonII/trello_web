import axios from "axios";
import { toast } from "react-toastify";
import { normalizeComments, normalizeNotes, normalizeChecklists, normalizeUser } from "../utils/normalize";

const API_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Không tìm thấy token trong localStorage!");
    throw new Error("Không tìm thấy token!");
  }
  return { Authorization: `Bearer ${token}` };
};

export const normalizeCard = (card) => {
  if (!card) return null;
  
  return {
    ...card,
    members: (card.members || []).map(normalizeUser),
    comments: normalizeComments(card.comments || []),
    notes: normalizeNotes(card.notes || []),
    checklists: normalizeChecklists(card.checklists || [])
  };
};

export const normalizeCards = (cards) => {
  if (!Array.isArray(cards)) return [];
  return cards.map(normalizeCard);
};



export const fetchCard = async (cardId) => {
  if (!cardId) {
    console.error("fetchCard: cardId không hợp lệ:", cardId);
    throw new Error("cardId không hợp lệ!");
  }
  try {
    const response = await axios.get(`${API_URL}/cards/${cardId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (err) {
    console.error("Lỗi fetch card:", err.response?.data || err.message);
    throw err;
  }
};

export const fetchCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    return response.data.user;
  } catch (err) {
    console.error("Lỗi fetch user:", err.response?.data || err.message);
    toast.error("Không thể lấy thông tin người dùng!");
    throw err;
  }
};

export const checkBoardOwner = async (boardId) => {
  if (!boardId) {
    console.error("checkBoardOwner: boardId không hợp lệ:", boardId);
    throw new Error("boardId không hợp lệ!");
  }
  try {
    const response = await axios.get(`${API_URL}/boards/${boardId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.owner;
  } catch (err) {
    console.error("Lỗi check owner:", err.response?.data || err.message);
    toast.error("Không thể xác minh quyền chủ board!");
    throw err;
  }
};

export const addNote = async (cardId, content) => {
  if (!cardId || !content?.trim()) {
    console.error("addNote: Dữ liệu không hợp lệ:", { cardId, content });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.post(
      `${API_URL}/cards/${cardId}/notes`,
      { content },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi thêm note:", err.response?.data || err.message);
    toast.error("Lỗi thêm note!");
    throw err;
  }
};

export const hideNote = async (cardId, noteId) => {
  if (!cardId || !noteId) {
    console.error("hideNote: Dữ liệu không hợp lệ:", { cardId, noteId });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.delete(
      `${API_URL}/cards/${cardId}/notes/${noteId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi ẩn note:", err.response?.data || err.message);
    toast.error("Lỗi ẩn note!");
    throw err;
  }
};

export const addComment = async (cardId, content) => {
  if (!cardId || !content?.trim()) {
    console.error("addComment: Dữ liệu không hợp lệ:", { cardId, content });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.post(
      `${API_URL}/cards/${cardId}/comments`,
      { text: content }, // Sửa từ content thành text để khớp với backend
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi thêm bình luận:", err.response?.data || err.message);
    toast.error("Lỗi thêm bình luận!");
    throw err;
  }
};

export const hideComment = async (cardId, commentId) => {
  if (!cardId || !commentId) {
    console.error("hideComment: Dữ liệu không hợp lệ:", { cardId, commentId });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.delete(
      `${API_URL}/cards/${cardId}/comments/${commentId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi ẩn bình luận:", err.response?.data || err.message);
    toast.error("Lỗi ẩn bình luận!");
    throw err;
  }
};

export const addChecklist = async (cardId, title) => {
  if (!cardId || !title?.trim()) {
    console.error("addChecklist: Dữ liệu không hợp lệ:", { cardId, title });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.post(
      `${API_URL}/cards/${cardId}/checklists`,
      { title },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi thêm danh sách kiểm tra:", err.response?.data || err.message);
    toast.error("Lỗi thêm danh sách kiểm tra!");
    throw err;
  }
};

export const updateChecklist = async (cardId, checklistId, title) => {
  if (!cardId || !checklistId || !title?.trim()) {
    console.error("updateChecklist: Dữ liệu không hợp lệ:", { cardId, checklistId, title });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.put(
      `${API_URL}/cards/${cardId}/checklists/${checklistId}`,
      { title },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi cập nhật danh sách kiểm tra:", err.response?.data || err.message);
    toast.error("Lỗi cập nhật danh sách kiểm tra!");
    throw err;
  }
};

export const deleteChecklist = async (cardId, checklistId) => {
  if (!cardId || !checklistId) {
    console.error("deleteChecklist: Dữ liệu không hợp lệ:", { cardId, checklistId });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.delete(
      `${API_URL}/cards/${cardId}/checklists/${checklistId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi xóa danh sách kiểm tra:", err.response?.data || err.message);
    toast.error("Lỗi xóa danh sách kiểm tra!");
    throw err;
  }
};

export const addChecklistItem = async (cardId, checklistId, { title, content }) => {
  if (!cardId || !checklistId || !title?.trim() || !content?.trim()) {
    console.error("addChecklistItem: Dữ liệu không hợp lệ:", { cardId, checklistId, title, content });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.post(
      `${API_URL}/cards/${cardId}/checklists/${checklistId}/items`,
      { title, content }, // Gửi cả title và content để khớp với backend
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi thêm mục danh sách kiểm tra:", err.response?.data || err.message);
    toast.error(err.response?.data?.message || "Lỗi thêm mục danh sách kiểm tra!");
    throw err;
  }
};

export const updateChecklistItem = async (cardId, checklistId, itemId, { title, content }) => {
  if (!cardId || !checklistId || !itemId || !title?.trim()) { // Bỏ check content nếu không bắt buộc
    console.error("updateChecklistItem: Dữ liệu không hợp lệ:", { cardId, checklistId, itemId, title, content });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.put(
      `${API_URL}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`,
      { title, content: content || '' }, // Default content nếu rỗng
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi cập nhật mục danh sách kiểm tra:", err.response?.data || err.message);
    throw err; // Để toast.error trong handleSubmitEditItem bắt lỗi chi tiết
  }
};

export const deleteChecklistItem = async (cardId, checklistId, itemId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi xóa mục danh sách kiểm tra:", err);
    toast.error("Lỗi xóa mục danh sách kiểm tra!");
    throw err;
  }
};

export const toggleChecklistItem = async (cardId, checklistId, itemId, completed) => {
  try {
    const response = await axios.put(
      `${API_URL}/cards/${cardId}/checklists/${checklistId}/items/${itemId}/toggle`,
      { completed },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi thay đổi trạng thái mục danh sách kiểm tra:", err);
    toast.error("Lỗi thay đổi trạng thái mục danh sách kiểm tra!");
    throw err;
  }
};

export const removeMember = async (cardId, memberId) => {
  if (!cardId || !memberId) {
    console.error("removeMember: Dữ liệu không hợp lệ:", { cardId, memberId });
    throw new Error("Dữ liệu không hợp lệ!");
  }
  try {
    const response = await axios.delete(
      `${API_URL}/cards/${cardId}/members/${memberId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (err) {
    console.error("Lỗi xóa thành viên:", err.response?.data || err.message);
    toast.error("Lỗi xóa thành viên!");
    throw err;
  }
};