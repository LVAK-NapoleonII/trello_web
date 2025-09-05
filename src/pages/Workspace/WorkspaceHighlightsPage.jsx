import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, LinearProgress, List, ListItem, ListItemText, CircularProgress, Alert } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

const WorkspaceHighlightsPage = () => {
    const { workspaceId } = useParams();
    const [boardsProgress, setBoardsProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Vui lòng đăng nhập!");

                // Lấy danh sách board trong workspace
                const boardsResponse = await axios.get(`http://localhost:5000/api/boards/workspace/${workspaceId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const progressData = await Promise.all(
                    boardsResponse.data.map(async (board) => {
                        // Lấy danh sách card trong board
                        const cardsResponse = await axios.get(`http://localhost:5000/api/cards/board/${board._id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        const cards = cardsResponse.data;
                        const totalCards = cards.length;
                        const completedCards = cards.filter((card) => card.completed).length;
                        const cardProgress = totalCards > 0 ? (completedCards / totalCards) * 100 : 0;

                        // Tính progress checklists
                        let totalItems = 0;
                        let completedItems = 0;
                        cards.forEach((card) => {
                            card.checklists.forEach((checklist) => {
                                totalItems += checklist.items.length;
                                completedItems += checklist.items.filter((item) => item.completed).length;
                            });
                        });
                        const checklistProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                        return {
                            boardName: board.title,
                            cardProgress,
                            checklistProgress,
                        };
                    })
                );

                setBoardsProgress(progressData);
            } catch (err) {
                setError(err.response?.data?.message || "Không thể tải dữ liệu hoàn thành!");
                toast.error("Không thể tải dữ liệu hoàn thành!");
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [workspaceId]);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Mức độ hoàn thành của các bảng
            </Typography>
            <List>
                {boardsProgress.length > 0 ? (
                    boardsProgress.map((progress, index) => (
                        <ListItem key={index} divider>
                            <ListItemText
                                primary={progress.boardName}
                                secondary={
                                    <>
                                        <Typography variant="body2">Hoàn thành card: {progress.cardProgress.toFixed(2)}%</Typography>
                                        <LinearProgress variant="determinate" value={progress.cardProgress} sx={{ my: 1 }} />
                                        <Typography variant="body2">Hoàn thành checklist: {progress.checklistProgress.toFixed(2)}%</Typography>
                                        <LinearProgress variant="determinate" value={progress.checklistProgress} />
                                    </>
                                }
                            />
                        </ListItem>
                    ))
                ) : (
                    <Typography>Không có bảng hoặc dữ liệu hoàn thành trong workspace này.</Typography>
                )}
            </List>
        </Box>
    );
};

export default WorkspaceHighlightsPage;