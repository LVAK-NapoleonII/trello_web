import { CardMedia } from "@mui/material";

function CardCover({ cover }) {
  if (!cover) return null;

  return (
    <CardMedia
      sx={{
        height: 120,
        borderRadius: "8px 8px 0 0",
        objectFit: "cover",
      }}
      image={cover}
      component="img"
    />
  );
}

export default CardCover;
