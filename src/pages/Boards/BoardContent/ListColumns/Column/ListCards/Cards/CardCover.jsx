import { CardMedia, Box } from "@mui/material";

function CardCover({ cover, onClick }) {
  if (!cover) return null;

  const isColor = cover.startsWith("#");

  const sharedSx = {
    height: 120,
    borderRadius: "8px 8px 0 0",
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s ease",
    "&:hover": onClick
      ? {
        opacity: 0.9,
        transform: "scale(1.01)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }
      : {},
  };

  if (isColor) {
    return <Box sx={{ ...sharedSx, bgcolor: cover }} onClick={onClick} />;
  }

  return (
    <CardMedia
      component="img"
      image={cover}
      alt="Card cover"
      sx={{ ...sharedSx, objectFit: "cover" }}
      onClick={onClick}
    />
  );
}

export default CardCover;