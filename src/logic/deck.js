// 大富豪用デッキ生成
export const createDeck = () => {
  const suits = ["♠", "♥", "♦", "♣"];

  const ranks = [
    { rank: "3", power: 3 },
    { rank: "4", power: 4 },
    { rank: "5", power: 5 },
    { rank: "6", power: 6 },
    { rank: "7", power: 7 },
    { rank: "8", power: 8 },
    { rank: "9", power: 9 },
    { rank: "10", power: 10 },
    { rank: "J", power: 11 },
    { rank: "Q", power: 12 },
    { rank: "K", power: 13 },
    { rank: "A", power: 14 },
    { rank: "2", power: 15 },
  ];

  const deck = [];
  deck.push({
    suit: "🃏",
    rank: "JOKER",
    power: 99,
  });
  
  for (const suit of suits) {
    for (const r of ranks) {
      deck.push({
        suit,
        rank: r.rank,
        power: r.power,
      });
    }
  }

  return deck;
};

// シャッフル（そのまま使える）
export const shuffleDeck = (deck) => {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};
