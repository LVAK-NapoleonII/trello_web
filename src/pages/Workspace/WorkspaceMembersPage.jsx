import { useParams } from "react-router-dom";

const WorkspaceMembersPage = () => {
  const { id } = useParams();
  return (
    <div>
      <h2>Thành viên của không gian làm việc {id}</h2>
      {/* Hiển thị danh sách thành viên */}
    </div>
  );
};

export default WorkspaceMembersPage;
