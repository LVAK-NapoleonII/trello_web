import { useContext } from "react";
import { Box, Collapse, CircularProgress } from "@mui/material";
import { SocketContext } from "../../../../../../../context/SocketContext";
import AddMemberDialog from "./AddMemberDialog";
import MembersSection from "./MembersSection";
import NotesSection from "./NotesSection";
import ChecklistsSection from "./ChecklistsSection";
import CommentsSection from "./CommentsSection";
import DescriptionSection from "./DescriptionSection"
import DueDateSection from "./DueDateSection"
import LabelsSection from "./LabelsSection"
import { useCardDetails } from "../../../../../../../components/hooks/useCardDetails";
import { useCardSocket } from "../../../../../../../components/hooks/useCardSocket";
import { normalizeChecklists } from "../../../../../../../components/utils/normalize";

function CardDetails({ card, setCards, setColumns, expanded, setExpanded, boardMembers, setBoardMembers }) {
  const { socket, socketReady } = useContext(SocketContext);
  const {
    comment,
    setComment,
    note,
    setNote,
    checklistTitle,
    setChecklistTitle,
    checklistItem,
    setChecklistItem,
    openAddMemberDialog,
    setOpenAddMemberDialog,
    currentUserId,
    isBoardOwner,
    loading,
    localBoardMembers,
    setLocalBoardMembers,
    pendingNotifications,
    setPendingNotifications,
    updateCardState,
    isMemberInBoard,
    handleAddNote,
    handleHideNote,
    handleAddComment,
    handleHideComment,
    handleAddChecklist,
    handleUpdateChecklist,
    handleDeleteChecklist,
    handleAddChecklistItem,
    handleUpdateChecklistItem,
    handleDeleteChecklistItem,
    handleToggleChecklistItem,
    handleRemoveMember,
    memoizedMembers,
    memoizedBoardMembers,
  } = useCardDetails(card, setCards, setColumns, boardMembers);

  useCardSocket(
    socket,
    socketReady,
    card,
    currentUserId,
    updateCardState,
    setColumns,
    pendingNotifications,
    setPendingNotifications
  );

  return (
    <Collapse in={expanded} timeout="auto" unmountOnExit>
      <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1, boxShadow: 3 }}>
        {loading.user ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <MembersSection
              members={memoizedMembers}
              boardMembers={memoizedBoardMembers}
              isBoardOwner={isBoardOwner}
              loading={loading}
              isMemberInBoard={isMemberInBoard}
              handleRemoveMember={handleRemoveMember}
              setOpenAddMemberDialog={setOpenAddMemberDialog}
              cardId={card._id}
              setCards={setCards}
              setColumns={setColumns}
            />
            <NotesSection
              note={note}
              setNote={setNote}
              notes={card.notes || []}
              handleAddNote={handleAddNote}
              handleHideNote={handleHideNote}
              loading={loading}
              isMemberInBoard={isMemberInBoard}
              currentUserId={currentUserId}
              isBoardOwner={isBoardOwner}
            />
            <ChecklistsSection
              checklists={normalizeChecklists(card.checklists || [])}
              checklistTitle={checklistTitle}
              setChecklistTitle={setChecklistTitle}
              checklistItem={checklistItem}
              setChecklistItem={setChecklistItem}
              handleAddChecklist={handleAddChecklist}
              handleUpdateChecklist={handleUpdateChecklist}
              handleDeleteChecklist={handleDeleteChecklist}
              handleAddChecklistItem={handleAddChecklistItem}
              handleUpdateChecklistItem={handleUpdateChecklistItem}
              handleDeleteChecklistItem={handleDeleteChecklistItem}
              handleToggleChecklistItem={handleToggleChecklistItem}
              loading={loading}
            />
            <CommentsSection
              comments={card.comments || []}
              comment={comment}
              setComment={setComment}
              handleAddComment={handleAddComment}
              handleHideComment={handleHideComment}
              loading={loading}
              isMemberInBoard={isMemberInBoard}
              currentUserId={currentUserId}
              isBoardOwner={isBoardOwner}
              card={card}
            />
            <AddMemberDialog
              open={openAddMemberDialog}
              onClose={() => setOpenAddMemberDialog(false)}
              card={card}
              setCards={setCards}
              setColumns={setColumns}
              boardMembers={memoizedBoardMembers}
              setBoardMembers={setLocalBoardMembers}
            />
          </>
        )}
      </Box>
    </Collapse>
  );
}

export default CardDetails;