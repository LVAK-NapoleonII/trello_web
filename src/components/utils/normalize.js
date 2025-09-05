// Hàm chuẩn hóa checklists
export const normalizeChecklists = (checklists) => {
  const checklistsArray = Array.isArray(checklists) ? checklists : checklists?.checklists || [];

  return checklistsArray
    .filter((checklist) => !checklist.isDeleted)
    .map((checklist) => ({
      _id: checklist._id || new Date().toISOString(),
      title: checklist.title || "Danh sách kiểm tra không tên",
      items: (Array.isArray(checklist.items) ? checklist.items : [])
        .filter((item) => !item.isDeleted)
        .map((item) => ({
          _id: item._id || new Date().toISOString(),
          title: item.title || "",
          content: item.content || "",
          completed: !!item.completed,
          createdAt: item.createdAt || new Date().toISOString(),
        })),
    }));
};

// Hàm chuẩn hóa user
export const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') {
    return {
      _id: null,
      fullName: 'Người dùng không xác định',
      email: '',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=Unknown'
    };
  }

  const userId = user._id || user.id || null;
  const userName = (user.fullName || user.name || (userId ? 'Người dùng' : 'Người dùng không xác định')).trim();

  return {
    _id: userId ? userId.toString() : null,
    fullName: userName,
    email: typeof user.email === 'string' ? user.email : '',
    avatar: typeof user.avatar === 'string' && user.avatar 
      ? user.avatar 
      : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(userName)}`
  };
};

// Hàm chuẩn hóa comments
export const normalizeComments = (comments) => {
  if (!Array.isArray(comments)) return [];
  return comments.map((comment) => ({
    _id: comment._id || comment.id,
    text: comment.text || "",
    user: normalizeUser(comment.user || {}),
    createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
    isDeleted: comment.isDeleted || false,
  }));
};
// Hàm chuẩn hóa notes
export const normalizeNotes = (notes) => {
  if (!Array.isArray(notes)) return [];
  return notes.map((note) => ({
    _id: note._id || note.id,
    content: note.content || "",
    createdBy: normalizeUser(note.createdBy || {}),
    createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
    isDeleted: note.isDeleted || false,
  }));
};