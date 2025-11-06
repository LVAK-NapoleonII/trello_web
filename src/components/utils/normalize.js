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


export const normalizeUser = (user) => {
  // Nếu user không tồn tại hoặc không phải object
  if (!user || typeof user !== 'object') {
    return {
      _id: 'unknown-user', 
      fullName: 'Người dùng không xác định',
      email: '',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=Unknown'
    };
  }

  // Lấy ID an toàn
  const userId = user._id || user.id || 'unknown-user';
  const userName = (user.fullName || user.name || 'Người dùng không xác định').trim();

  return {
    _id: userId.toString(), 
    fullName: userName,
    email: typeof user.email === 'string' ? user.email : '',
    avatar: typeof user.avatar === 'string' && user.avatar 
      ? user.avatar 
      : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(userName)}`
  };
};

export const normalizeComments = (comments) => {
  if (!Array.isArray(comments)) return [];
  
  return comments
    .filter(comment => !comment.isDeleted)
    .map((comment) => {
      const normalizedUser = normalizeUser(comment.user);
      
      return {
        _id: comment._id || comment.id || `temp-comment-${Date.now()}-${Math.random()}`,
        text: comment.text || comment.content || "", 
        user: normalizedUser,
        createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
        isDeleted: comment.isDeleted || false,
      };
    });
};


export const normalizeNotes = (notes) => {
  if (!Array.isArray(notes)) return [];
  
  return notes
    .filter(note => !note.isDeleted) 
    .map((note) => {
      const normalizedCreator = normalizeUser(note.createdBy);
      
      return {
        _id: note._id || note.id || `temp-note-${Date.now()}-${Math.random()}`,
        content: note.content || note.text || "", 
        createdBy: normalizedCreator,
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        isDeleted: note.isDeleted || false,
      };
    });
};