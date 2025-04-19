import { useParams } from "react-router-dom";

const WorkspaceSettingsPage = () => {
  const { id } = useParams();
  return (
    <div>
      <h2>Cài đặt của không gian làm việc {id}</h2>
      {/* Form cài đặt */}
    </div>
  );
};

export default WorkspaceSettingsPage;
