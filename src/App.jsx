
import Card from "./components/Card";
import { useEffect, useState } from "react";
import { createDeck, shuffleDeck } from "./logic/deck";
const applySpecialRules = ({
  cards,
  actor, // "player" | "cpu"
  playerHand,
  cpuHand,
}) => {
  const rank = cards[0].rank;
  const count = cards.length;

  let newPlayerHand = [...playerHand];
  let newCpuHand = [...cpuHand];

  /* ===== 8切り ===== */
  if (rank === "8") {
    return {
      newPlayerHand,
      newCpuHand,
      clearTable: true,
      nextTurn: actor, // 同じ人が続行
      message: `🔥 ${actor === "cpu" ? "CPU" : "あなた"}の8切り！`,
    };
  }

  /* ===== イレブンバック ===== */
  if (rank === "J") {
    setElevenBack((prev) => !prev);
  }

  /* ===== 革命 ===== */
  if (count === 4) {
    setRevolution((prev) => !prev);
  }

  /* ===== 7渡し ===== */
  if (rank === "7") {
    for (let i = 0; i < count; i++) {
      if (actor === "cpu" && newCpuHand.length > 0) {
        const weakest = [...newCpuHand].sort((a, b) => a.power - b.power)[0];
        newCpuHand = newCpuHand.filter((c) => c !== weakest);
        newPlayerHand.push(weakest);
      }
      if (actor === "player" && newPlayerHand.length > 0) {
        const weakest = [...newPlayerHand].sort((a, b) => a.power - b.power)[0];
        newPlayerHand = newPlayerHand.filter((c) => c !== weakest);
        newCpuHand.push(weakest);
      }
    }
  }

  return {
    newPlayerHand,
    newCpuHand,
    clearTable: false,
    nextTurn: actor === "cpu" ? "player" : "cpu",
    message: "",
  };
};

function App() {
  const [playerHand, setPlayerHand] = useState([]);
  const [cpuHand, setCpuHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  // ⭐ field に統合
  const [field, setField] = useState({
    table: null,     // { rank, power, count } | null
    passCount: 0,
  });

  const [turn, setTurn] = useState("player");
  const [message, setMessage] = useState("");
  const [winner, setWinner] = useState(null);

  const [revolution, setRevolution] = useState(false);
  const [elevenBack, setElevenBack] = useState(false);

  /* ===== 初期配布 ===== */
  useEffect(() => {
    const deck = shuffleDeck(createDeck());
    setPlayerHand(deck.slice(0, 13));
    setCpuHand(deck.slice(13, 26));
    setGameStarted(true); // ← これ超重要

  }, []);

  /* ===== 勝敗 ===== */
  useEffect(() => {
    if (!gameStarted) return;
  
    if (playerHand.length === 0) setWinner("player");
    if (cpuHand.length === 0) setWinner("cpu");
  }, [playerHand, cpuHand, gameStarted]);
  
  /* ===== CPU自動行動 ===== */
  useEffect(() => {
    if (turn !== "cpu" || winner) return;

    const timer = setTimeout(() => {
      cpuTurn(cpuHand);
    }, 700);

    return () => clearTimeout(timer);
  }, [turn, cpuHand, winner]);

  /* ===== 全員パスで場流し ===== */
  useEffect(() => {
    if (field.passCount >= 2 && field.table) {
      setField({ table: null, passCount: 0 });
      setMessage("全員パス！場が流れました");
      setTurn("player");
    }
  }, [field]);

  /* ===== 出せるか判定 ===== */
  const canPlaySet = (cards) => {
    if (!cards.length) return false;

    const rank = cards[0].rank;
    if (!cards.every(c => c.rank === rank)) return false;

    // 場が空 → 何でもOK
    if (!field.table) return true;

    if (cards.length !== field.table.count) return false;

    const reversed = revolution !== elevenBack;
    return reversed
      ? cards[0].power < field.table.power
      : cards[0].power > field.table.power;
  };

  /* ===== カード選択 ===== */
  const handleCardClick = (card) => {
    if (turn !== "player") return;

    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter(c => c !== card));
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

  /* ===== パス ===== */
  const passTurn = () => {
    setSelectedCards([]);
    setMessage("あなたはパスしました");
    setField(prev => ({
      ...prev,
      passCount: prev.passCount + 1,
    }));
    setTurn("cpu");
  };

  /* ===== 出す ===== */
  const playCards = () => {
    if (!canPlaySet(selectedCards)) return;

    const rank = selectedCards[0].rank;
    const power = selectedCards[0].power;
    const count = selectedCards.length;

    let newPlayerHand = [...playerHand];
    let newCpuHand = [...cpuHand];

    /* ===== イレブンバック ===== */
    if (rank === "J") {
      setElevenBack(prev => !prev);
      setMessage("⬇️ イレブンバック発動！");
    }

    /* ===== 7渡し（簡易・自動）===== */
    if (rank === "7") {
      const give = newPlayerHand
        .filter(c => c.rank !== "7")
        .slice(0, count);

      newPlayerHand = newPlayerHand.filter(c => !give.includes(c));
      newCpuHand = [...newCpuHand, ...give];
      setMessage(`🎁 7渡し！${count}枚渡しました`);
    }

    /* ===== 8切り ===== */
    if (rank === "8") {
      selectedCards.forEach(c => {
        newPlayerHand = newPlayerHand.filter(x => x !== c);
      });

      setPlayerHand(newPlayerHand);
      setCpuHand(newCpuHand);

      setField({ table: null, passCount: 0 });
      setSelectedCards([]);
      setMessage("🔥 8切り！もう一度あなたのターン！");
      setTurn("player");
      return;
    }

    /* ===== 革命 ===== */
    if (count === 4) {
      setRevolution(prev => !prev);
      setMessage("🔄 革命発動！");
    }

    /* ===== 手牌削除 ===== */
    selectedCards.forEach(c => {
      newPlayerHand = newPlayerHand.filter(x => x !== c);
    });

    setPlayerHand(newPlayerHand);
    setCpuHand(newCpuHand);
    setSelectedCards([]);

    setField({
      table: { rank, power, count },
      passCount: 0,
    });

    setTurn("cpu");
  };

  /* ===== CPU ===== */
  const cpuTurn = (hand) => {
    console.log("🤖 cpuTurn 実行");
  
    const { table, passCount } = field;
  
    /* ===== 出せる手を作る ===== */
    const groups = {};
    hand.forEach((c) => {
      groups[c.rank] = groups[c.rank] || [];
      groups[c.rank].push(c);
    });
  
    let playableSets = [];
  
    Object.values(groups).forEach((g) => {
      // 場が空 → 1枚
      if (!table) {
        playableSets.push([g[0]]);
      }
      // 場あり → 枚数一致＋強さ判定
      else if (g.length >= table.count) {
        const candidate = g.slice(0, table.count);
        if (canPlaySet(candidate)) {
          playableSets.push(candidate);
        }
      }
    });
  
    /* ===== 出せない → パス ===== */
    if (playableSets.length === 0) {
      console.log("🤖 CPU パス");
      setMessage("CPUはパス");
  
      setField((prev) => ({
        ...prev,
        passCount: prev.passCount + 1,
      }));
  
      setTurn("player");
      return;
    }
  
    /* ===== 一番弱い手を出す ===== */
    const set = playableSets.sort(
      (a, b) => a[0].power - b[0].power
    )[0];
  
    console.log("🤖 CPU 出す:", set);
  
    /* ===== 手牌削除 ===== */
    let newCpuHand = [...hand];
    set.forEach((c) => {
      newCpuHand = newCpuHand.filter((x) => x !== c);
    });
    setCpuHand(newCpuHand);
  
    /* ===== 役処理 ===== */
  
    // 🔥 8切り
    if (set[0].rank === "8") {
      setField({
        table: null,
        passCount: 0,
      });
  
      setMessage("🔥 CPUの8切り！");
      setTurn("cpu"); // もう一度CPU
      return;
    }
  
    // 🎁 7渡し
    if (set[0].rank === "7") {
      let newPlayerHand = [...playerHand];
  
      for (let i = 0; i < set.length; i++) {
        if (newCpuHand.length === 0) break;
        const weakest = [...newCpuHand].sort(
          (a, b) => a.power - b.power
        )[0];
        newCpuHand = newCpuHand.filter((c) => c !== weakest);
        newPlayerHand.push(weakest);
      }
  
      setCpuHand(newCpuHand);
      setPlayerHand(newPlayerHand);
  
      setField({
        table: {
          rank: "7",
          power: set[0].power,
          count: set.length,
        },
        passCount: 0,
      });
  
      setMessage("🎁 CPUの7渡し！");
      setTurn("player");
      return;
    }
  
    // ⬇️ イレブンバック
    if (set[0].rank === "J") {
      setElevenBack((prev) => !prev);
      setMessage("⬇️ CPUのイレブンバック！");
    }
  
    // 🔄 革命
    if (set.length === 4) {
      setRevolution((prev) => !prev);
      setMessage("🔄 CPUの革命！");
    }
  
    /* ===== 通常出し ===== */
    setField({
      table: {
        rank: set[0].rank,
        power: set[0].power,
        count: set.length,
      },
      passCount: 0,
    });
  
    setTurn("player");
  };
  
  
  /* ===== UI ===== */
  return (
    <div style={{ padding: 20 }}>
      <h1>大富豪</h1>
      <p>{message}</p>

      <h2>CPU（{cpuHand.length}枚）</h2>
     
    <div style={{ display: "flex", gap: 8 }}>
       {cpuHand.map((_, i) => (
    <div
       key={i}
        style={{
        width: 50,
        height: 70,
        background: "#333",
        borderRadius: 6,
        border: "2px solid #000",
      }}
        />
       ))}
        </div>

      <div style={{ margin: "20px 0" }}>
        {field.table ? (
          Array.from({ length: field.table.count }).map((_, i) => (
            <span key={i} style={{ margin: 8 }}>
              {field.table.rank}
            </span>
          ))
        ) : (
          <span>ここにカードを出します</span>
        )}
      </div>

      <h2>あなたの手札</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
            {card.rank}{card.suit}
          </div>
        ))}
      </div>

      {!winner && (
        <div style={{ marginTop: 16 }}>
          <button onClick={playCards}>出す</button>
          <button onClick={passTurn}>パス</button>
        </div>
      )}

      {winner && <h2>{winner === "player" ? "🎉 YOU WIN" : "🤖 CPU WIN"}</h2>}
    </div>
  );
}

export default App;
