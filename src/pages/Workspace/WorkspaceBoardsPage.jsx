import { useParams } from "react-router-dom";

const WorkspaceBoardsPage = () => {
  const { id } = useParams();
  return (
    <div>
      <h2>Danh sách bảng của không gian làm việc {id}</h2>
      {/* Hiển thị danh sách bảng */}
    </div>
  );
};

export default WorkspaceBoardsPage;
