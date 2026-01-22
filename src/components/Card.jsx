function Card({ card, hidden = false, selected = false, onClick }) {
  return (
    <div
      onClick={hidden ? undefined : onClick}
      style={{
        width: 60,
        height: 90,
        borderRadius: 8,
        border: selected ? "3px solid red" : "2px solid #000",
        background: hidden
          ? "linear-gradient(135deg, #444, #111)"
          : "#fff",
        color: hidden ? "#fff" : "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        fontWeight: "bold",
        boxShadow: "2px 2px 6px rgba(0,0,0,0.3)",
        cursor: hidden ? "default" : "pointer",
        userSelect: "none",
        transform: selected ? "translateY(-6px)" : "none",
      }}
    >
      {hidden ? "🂠" : `${card.rank}${card.suit}`}
    </div>
  );
}

export default Card;
