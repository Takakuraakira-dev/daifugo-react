import { useEffect, useState } from "react";
import Card from "./components/Card";
import { createDeck, shuffleDeck } from "./logic/deck";
const ROLE_MAP = [
  "🏆 大富豪",
  "⚠️ 富豪",
  "🙂 平民",
  "💀 大貧民",
];
export default function App() {
  /* ===== プレイヤー ===== */
  const [players, setPlayers] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [rankings, setRankings] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  /* ===== フィールド ===== */
  const [field, setField] = useState({
    table: null, // { rank, power, count }
    passCount: 0,
  });

  /* ===== ルール ===== */
  const [revolution, setRevolution] = useState(false);
  const [elevenBack, setElevenBack] = useState(false);

  /* ===== 状態 ===== */
  const [message, setMessage] = useState("");
  const [winner, setWinner] = useState(null);
 
  /* ===== 初期配布（4人） ===== */
  useEffect(() => {
    const deck = shuffleDeck(createDeck());
    const hands = Array.from({ length: 4 }, () => []);
  
    deck.forEach((card, i) => {
      hands[i % 4].push(card);
    });
  
    setPlayers([
      { id: "you", name: "YOU", hand: hands[0], isCPU: false },
      { id: "cpu1", name: "CPU 1", hand: hands[1], isCPU: true },
      { id: "cpu2", name: "CPU 2", hand: hands[2], isCPU: true },
      { id: "cpu3", name: "CPU 3", hand: hands[3], isCPU: true },
    ]);
    setRankings([]);          // ← ★ここ
    setTurnIndex(0);
    setGameStarted(true);
  }, []);
   
  
    
  const currentPlayer = players[turnIndex];
  const you = players.find(p => p.id === "you");
  const gameFinished =
  players.length > 0 &&
  rankings.length === players.length;
  
  
  const rankedWithRoles = gameFinished
  ? rankings.map((id, index) => {
      const player = players.find(p => p.id === id);

      return {
        ...player,
        role: ROLE_MAP[index],
      };
    })
  : [];


  const isYourTurn =
    gameStarted && currentPlayer?.id === "you";
/* ===== 勝敗判定 ===== */
useEffect(() => {
  if (!players.length) return;

  players.forEach((p) => {
    if (p.hand.length === 0 && !rankings.includes(p.id)) {
      console.log("追加:", p.name);
      setRankings((prev) => [...prev, p.id]);
    }
  });

}, [players]);



  
  /* ===== 出せるか判定 ===== */
  const canPlaySet = (cards) => {
    if (!cards.length) return false;

    const rank = cards[0].rank;
    if (!cards.every((c) => c.rank === rank)) return false;

    if (!field.table) return true;
    if (cards.length !== field.table.count) return false;

    const reversed = revolution !== elevenBack;
    return reversed
      ? cards[0].power < field.table.power
      : cards[0].power > field.table.power;
  };

  /* ===== カード選択 ===== */
  const handleCardClick = (card) => {
    if (!isYourTurn) return;

    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter((c) => c !== card));
      return;
    }

    if (
      selectedCards.length === 0 ||
      card.rank === selectedCards[0].rank
    ) {
      setSelectedCards([...selectedCards, card]);
    } else {
      setSelectedCards([card]);
    }
  };

  /* ===== ターン進行 ===== */
  const nextTurn = () => {
    setTurnIndex((i) => (i + 1) % players.length);
  };

  /* ===== パス ===== */
  const passTurn = () => {
    setSelectedCards([]);
    setMessage("YOUはパス");
    setField((f) => ({ ...f, passCount: f.passCount + 1 }));
    nextTurn();
  };

  /* ===== 全員パスで流し ===== */
  useEffect(() => {
    if (field.passCount >= players.length - 1 && field.table) {
      setField({ table: null, passCount: 0 });
      setMessage("全員パス！場が流れました");
    }
  }, [field, players.length]);

  /* ===== YOUが出す ===== */
  const playCards = () => {
    if (!isYourTurn) return;
    if (selectedCards.length === 0) return;
    if (!canPlaySet(selectedCards)) return;

    const set = selectedCards;
    const rank = set[0].rank;

    // 手牌削除
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === "you"
          ? { ...p, hand: p.hand.filter((c) => !set.includes(c)) }
          : p
      )
    );

    /* ==== 役 ==== */
    if (rank === "8") {
      setField({ table: null, passCount: 0 });
      setSelectedCards([]);
      setMessage("🔥 8切り！もう一度！");
      return;
    }

    if (rank === "J") {
      setElevenBack((p) => !p);
      setMessage("⬇️ イレブンバック！");
    }

    if (set.length === 4) {
      setRevolution((p) => !p);
      setMessage("🔄 革命！");
    }

    setField({
      table: {
        rank,
        power: set[0].power,
        count: set.length,
      },
      passCount: 0,
    });

    setSelectedCards([]);
    nextTurn();
  };

  /* ===== CPU自動行動 ===== */
  useEffect(() => {
    if (!currentPlayer || !currentPlayer.isCPU || winner) return;

    const timer = setTimeout(() => {
      cpuTurn(currentPlayer);
    }, 800);

    return () => clearTimeout(timer);
  }, [turnIndex, currentPlayer, winner]);

  const cpuTurn = (cpu) => {
    const hand = cpu.hand;

    const groups = {};
    hand.forEach((c) => {
      groups[c.rank] = groups[c.rank] || [];
      groups[c.rank].push(c);
    });

    let playable = [];

    Object.values(groups).forEach((g) => {
      if (!field.table) playable.push([g[0]]);
      else if (g.length >= field.table.count) {
        const s = g.slice(0, field.table.count);
        if (canPlaySet(s)) playable.push(s);
      }
    });

    if (!playable.length) {
      setMessage(`${cpu.name} はパス`);
      setField((f) => ({ ...f, passCount: f.passCount + 1 }));
      nextTurn();
      return;
    }

    const set = playable.sort((a, b) => a[0].power - b[0].power)[0];

    // 手牌削除
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === cpu.id
          ? { ...p, hand: p.hand.filter((c) => !set.includes(c)) }
          : p
      )
    );

    if (set[0].rank === "8") {
      setField({ table: null, passCount: 0 });
      setMessage(`🔥 ${cpu.name} の8切り！`);
      nextTurn(); // ⭐ これ超重要
      return;
    }

    if (set[0].rank === "J") setElevenBack((p) => !p);
    if (set.length === 4) setRevolution((p) => !p);

    setField({
      table: {
        rank: set[0].rank,
        power: set[0].power,
        count: set.length,
      },
      passCount: 0,
    });

    setMessage(`${cpu.name} が出しました`);
    nextTurn();
  };

  /* ===== UI ===== */
  return (
    <div style={{ padding: 20 }}>
      <h1>大富豪</h1>
      <p>{message}</p>
  
      {/* ===== CPU ===== */}
      {players
        .filter((p) => p.isCPU)
        .map((cpu) => (
          <div key={cpu.id} style={{ marginBottom: 8 }}>
            {cpu.name}（{cpu.hand.length}枚）
            <div style={{ display: "flex", gap: 4 }}>
              {cpu.hand.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 40,
                    height: 60,
                    background: "#333",
                    borderRadius: 4,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
  
      {/* ===== 場 ===== */}
      <div style={{ margin: 20 }}>
        {field.table ? (
          Array.from({ length: field.table.count }).map((_, i) => (
            <span key={i} style={{ margin: 6 }}>
              {field.table.rank}
            </span>
          ))
        ) : (
          <span>場は空です</span>
        )}
      </div>
  
      {/* ===== YOU ===== */}
      <h2>YOU</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {you?.hand.map((card, i) => (
          <Card
            key={i}
            card={card}
            selected={selectedCards.includes(card)}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>
  
      {/* ===== 操作ボタン ===== */}
      {!winner && isYourTurn && !gameFinished && (
        <div style={{ marginTop: 16 }}>
          <button onClick={playCards}>出す</button>
          <button onClick={passTurn}>パス</button>
        </div>
      )}
  
      {/* ===== 結果発表 ===== */}
      {gameFinished && (
        <div style={{ marginTop: 24 }}>
          <h2>🏆 結果発表</h2>
          {rankedWithRoles.map((p, i) => (
            <div key={p.id}>
              {i + 1}位：{p.name}（{p.role}）
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
