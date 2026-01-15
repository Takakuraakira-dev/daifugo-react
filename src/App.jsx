import { useEffect, useState } from "react";
import { createDeck, shuffleDeck } from "./logic/deck";

function App() {
  const [playerHand, setPlayerHand] = useState([]);
  const [cpuHand, setCpuHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [table, setTable] = useState(null); // { rank, power, count }
  const [turn, setTurn] = useState("player");
  const [message, setMessage] = useState("");
  const [winner, setWinner] = useState(null);

  const [passCount, setPassCount] = useState(0);
  const [lastPlayedBy, setLastPlayedBy] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [revolution, setRevolution] = useState(false);
  const [elevenBack, setElevenBack] = useState(false);

  /* ===== 初期配布 ===== */
  useEffect(() => {
    const deck = shuffleDeck(createDeck());
    setPlayerHand(deck.slice(0, 13));
    setCpuHand(deck.slice(13, 26));
    setGameStarted(true);
  }, []);

  /* ===== 勝敗判定（重要：gameStarted）===== */
  useEffect(() => {
    if (!gameStarted) return;

    if (playerHand.length === 0) {
      setWinner("player");
    } else if (cpuHand.length === 0) {
      setWinner("cpu");
    }
  }, [playerHand, cpuHand, gameStarted]);
/* ===== CPUの自動行動 ===== */
useEffect(() => {
  if (turn !== "cpu") return;
  if (isPaused) return;
  if (winner) return;

  const timer = setTimeout(() => {
    cpuTurn([...cpuHand]);
  }, 800);

  return () => clearTimeout(timer);
}, [turn, cpuHand, isPaused, winner]);

  /* ===== 全員パスで場流し ===== */
  useEffect(() => {
    if (passCount >= 2) {
      setTable(null);
      setPassCount(0);
      setSelectedCards([]); // ← ★超重要
      setMessage("全員パス！場が流れました");

      if (lastPlayedBy) {
        setTurn(lastPlayedBy);
      }
    }
  }, [passCount, lastPlayedBy]);

  /* ===== 中断 ===== */
  const togglePause = () => {
    setIsPaused((p) => !p);
  };

  /* ===== 出せるか判定 ===== */
  const canPlaySet = (cards) => {
    if (!cards || cards.length === 0) return false;
  
    const rank = cards[0].rank;
  
    // 同じ数字のみ
    if (!cards.every((c) => c.rank === rank)) return false;
  
    
  
    // ジョーカー単体
    if (cards.length === 1 && rank === "JOKER") return true;
  
    // 場が空
    if (!table) return true;
  
    // 枚数一致
    if (cards.length !== table.count) return false;
  
    // ジョーカー返し禁止
    if (table.rank === "JOKER") return false;
  
    const isReversed = revolution !== elevenBack;
  
    return isReversed
      ? cards[0].power < table.power
      : cards[0].power > table.power;
  };
  
  /* ===== カード選択 ===== */
  const handleCardClick = (card) => {
    if (isPaused || turn !== "player") return;

    const exists = selectedCards.includes(card);

    if (selectedCards.length === 0) {
      setSelectedCards([card]);
      return;
    }

    if (exists) {
      setSelectedCards(selectedCards.filter((c) => c !== card));
      return;
    }

    if (card.rank === selectedCards[0].rank) {
      setSelectedCards([...selectedCards, card]);
      return;
    }

    setSelectedCards([card]);
  };

  /* ===== パス ===== */
  const passTurn = () => {
    if (isPaused || turn !== "player") return;

    setSelectedCards([]);
    setMessage("あなたはパスしました");
    setPassCount((c) => c + 1);
    setTurn("cpu");

    
  };

  /* ===== 出す ===== */
  const playCards = () => {
    if (isPaused || !canPlaySet(selectedCards)) return;
  
    const rank = selectedCards[0].rank;
    const power = selectedCards[0].power;
    const count = selectedCards.length;
  
    let newPlayerHand = [...playerHand];
    let newCpuHand = [...cpuHand];
  
    /* ===== イレブンバック ===== */
    if (rank === "J") {
      setElevenBack((prev) => !prev);
      setMessage("⬇️ イレブンバック発動！");
    }
  
    /* ===== 7渡し ===== */
    if (rank === "7" && newCpuHand.length > 0) {
      const weakest = [...newCpuHand].sort(
        (a, b) => a.power - b.power
      )[0];
      newCpuHand = newCpuHand.filter((c) => c !== weakest);
      newPlayerHand.push(weakest);
      setMessage("🎁 7渡し発動！");
    }
   
    /* ===== 8切り ===== */
    if (rank === "8") {
      setTable(null);
      setMessage("🔥 8切り！場が流れました");
    } else {
      setTable({ rank, power, count });
    }
  
    /* ===== 革命（4枚）===== */
    if (count === 4) {
      setRevolution((prev) => !prev);
      setMessage("🔄 革命発動！");
    }
  
    /* ===== 手牌削除 ===== */
    selectedCards.forEach((c) => {
      newPlayerHand = newPlayerHand.filter((x) => x !== c);
    });
  
    setPlayerHand(newPlayerHand);
    setCpuHand(newCpuHand);
    setSelectedCards([]);
    setPassCount(0);
    setLastPlayedBy("player");
    setTurn("cpu");
  };
  

  /* ===== CPU ===== */
  const cpuTurn = (hand) => {
    console.log("🤖 cpuTurn 実行");
  
    if (isPaused) return;
  
    const groups = {};
    hand.forEach((c) => {
      groups[c.rank] = groups[c.rank] || [];
      groups[c.rank].push(c);
    });
  
    let playableSets = [];
  
    Object.values(groups).forEach((g) => {
      // 場が空 → 1枚出し
      if (!table) {
        playableSets.push([g[0]]);
      } 
      // 場がある → 枚数を合わせる
      else if (g.length >= table.count) {
        const candidate = g.slice(0, table.count);
        if (canPlaySet(candidate)) {
          playableSets.push(candidate);
        }
      }
    });
  
    if (playableSets.length === 0) {
      console.log("🤖 CPU パス");
      setMessage("CPUはパス");
      setPassCount((c) => c + 1);
      setTurn("player");
      return;
    }
  
    // 一番弱い手を出す（自然）
    const set = playableSets.sort(
      (a, b) => a[0].power - b[0].power
    )[0];
  

    console.log("🤖 CPU 出す:", set);
  
    setTable({
      rank: set[0].rank,
      power: set[0].power,
      count: set.length,
    });
  
    let newCpuHand = [...hand];
    set.forEach((c) => {
      newCpuHand = newCpuHand.filter((x) => x !== c);
    });
  
    setCpuHand(newCpuHand);
    setLastPlayedBy("cpu");
    setPassCount(0);
    setTurn("player");
  };
  
  /* ===== UI ===== */
  return (
    <div style={{ padding: 20 }}>
      <h1>大富豪</h1>
  
      {isPaused && (
        <div
          style={{
            background: "#0008",
            color: "#fff",
            padding: 10,
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          ⏸ ゲーム中断中
        </div>
      )}
  
      <p>{message}</p>
  

      <h2>CPU（{cpuHand.length}枚）</h2>
      <div style={{ display: "flex", gap: 6 }}>
        {cpuHand.map((_, i) => (
          <div
            key={i}
            style={{ width: 40, height: 60, background: "#444" }}
          />
        ))}
      </div>

      <div
  style={{
    margin: "20px 0",
    padding: 20,
    border: "2px dashed #999",
    minHeight: 100,
    display: "flex",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  }}
>
  {table ? (
    Array.from({ length: table.count }).map((_, i) => (
      <div
        key={i}
        style={{
          border: "2px solid green",
          borderRadius: "6px",
          padding: "12px",
          width: "60px",
          height: "80px",
          textAlign: "center",
          fontSize: "20px",
          background: "#eaffea",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {table.rank}
      </div>
    ))
    ) : (
    <span style={{ color: "#999" }}>ここにカードを出します</span>
    )}
    </div>
    

      <h2>あなたの手札</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {playerHand.map((card, i) => (
          <div
            key={i}
            onClick={() => handleCardClick(card)}
            style={{
              border: selectedCards.includes(card)
                ? "2px solid red"
                : "1px solid black",
              padding: 8,
              cursor: "pointer",
            }}
          >
            {card.rank}
            {card.suit}
          </div>
        ))}
      </div>

      {!winner && (
        <div style={{ marginTop: 16 }}>
          <button onClick={playCards} disabled={isPaused}>
            出す
          </button>
          <button onClick={passTurn} disabled={isPaused}>
            パス
          </button>
          <button onClick={togglePause}>
            {isPaused ? "再開" : "中断"}
          </button>
        </div>
      )}

      {winner && (
        <h2>{winner === "player" ? "🎉 YOU WIN" : "🤖 CPU WIN"}</h2>
      )}
    </div>
  );
}

export default App;
