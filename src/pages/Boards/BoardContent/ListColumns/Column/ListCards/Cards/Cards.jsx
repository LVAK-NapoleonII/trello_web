import CardContainer from "./CardContainer";

function Cards({ card, setCards, setColumns, boardMembers, setBoardMembers }) {
  console.log("Cards: Props received:", {
    boardMembers,
    isArray: Array.isArray(boardMembers),
    length: boardMembers?.length,
  });

  return (
    <CardContainer
      card={card}
      setCards={setCards}
      setColumns={setColumns}
      boardMembers={boardMembers}
      setBoardMembers={setBoardMembers}
    />
  );
}

export default Cards;
