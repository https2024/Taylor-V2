import Jimp from "jimp";
class GameSession {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.game = new BingoGame();
  }
}
class BingoGame {
  constructor() {
    this.players = [];
    this.currentTurn = 0;
    this.boardSize = 5;
    this.cards = {};
    this.numbersCalled = new Set();
    this.started = false;
  }
  initializeGame = async () => {
    this.players.forEach(player => this.cards[player] = this.generateBingoCard());
    this.currentTurn = Math.floor(Math.random() * this.players.length);
    this.started = true;
  };
  generateBingoCard = () => {
    let card = [];
    const columns = ["B", "I", "N", "G", "O"];
    let used = new Set();
    for (let col = 0; col < 5; col++) {
      let column = [];
      for (let i = 0; i < 5; i++) {
        let num;
        do {
          num = Math.floor(Math.random() * 15) + 1 + col * 15;
        } while (used.has(num));
        column.push(num);
        used.add(num);
      }
      card = card.concat(column);
    }
    return card;
  };
  callNumber = async (number, player) => {
    if (!this.started) return "Permainan Bingo belum dimulai.";
    if (player !== this.players[this.currentTurn]) return `Belum giliranmu, ${player}.`;
    this.numbersCalled.add(number);
    const currentCard = this.cards[player];
    const index = currentCard.indexOf(number);
    if (index !== -1) {
      currentCard[index] = 0;
      console.log(`${player} menandai nomor ${number} pada kartu Bingo mereka.`);
      for (const otherPlayer of this.players) {
        if (otherPlayer !== player) {
          const otherCard = this.cards[otherPlayer];
          const otherIndex = otherCard.indexOf(number);
          if (otherIndex !== -1) {
            currentCard[index] = "X";
            otherCard[otherIndex] = "X";
            console.log(`Angka ${number} telah dikeluarkan oleh Bot dan dimiliki oleh kedua pemain.`);
            break;
          }
        }
      }
    }
    if (this.checkBingo(currentCard)) {
      console.log(`Bingo! ${player} menang!`);
      this.endGame();
      return `${player} memenangkan permainan Bingo!`;
    }
    if (this.numbersCalled.size === 75) {
      console.log(`Permainan berakhir seri (draw).`);
      this.endGame();
      return `Permainan berakhir seri (draw)!`;
    }
    this.currentTurn = (this.currentTurn + 1) % this.players.length;
    return `${this.players[this.currentTurn]}'s turn`;
  };
  endGame = () => {
    this.started = false;
    this.players = [];
    this.cards = {};
    this.numbersCalled.clear();
  };
  getCardBuffer = async player => {
    try {
      const card = this.cards[player];
      const bg = await Jimp.read("./images/bingo.png");
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
      const colors = [255, 4278190335];
      for (let i = 0; i < 25; i++) {
        const col = Math.floor(card[i] / 25);
        const x = i % 5 * 100 + 50;
        const y = Math.floor(i / 5) * 100 + 95;
        const text = card[i] === 0 ? "X" : card[i].toString();
        const color = card[i] === 0 ? colors[1] : colors[0];
        bg.print(font, x, y, text).color([{
          apply: "xor",
          params: [color]
        }]);
      }
      return {
        buffer: await bg.getBufferAsync(Jimp.MIME_PNG),
        message: "Ini kartu Bingo Anda:"
      };
    } catch (error) {
      console.error(`Error generating Bingo card buffer for ${player}:`, error);
      throw new Error(`Gagal menghasilkan buffer kartu Bingo untuk ${player}`);
    }
  };
  checkBingo = card => {
    for (let i = 0; i < 25; i += 5) {
      if (card[i] === 0 && card[i + 1] === 0 && card[i + 2] === 0 && card[i + 3] === 0 && card[i + 4] === 0) {
        return true;
      }
    }
    for (let i = 0; i < 5; i++) {
      if (card[i] === 0 && card[i + 5] === 0 && card[i + 10] === 0 && card[i + 15] === 0 && card[i + 20] === 0) {
        return true;
      }
    }
    if (card[0] === 0 && card[6] === 0 && card[12] === 0 && card[18] === 0 && card[24] === 0) {
      return true;
    }
    if (card[4] === 0 && card[8] === 0 && card[12] === 0 && card[16] === 0 && card[20] === 0) {
      return true;
    }
    return false;
  };
}
const handler = async (m, {
  args,
  conn,
  command,
  usedPrefix
}) => {
  conn.bingo = conn.bingo || {};
  const sessions = conn.bingo;
  const sessionId = m.chat;
  const session = sessions[sessionId] ?? (sessions[sessionId] = new GameSession(sessionId));
  const game = session.game;
  switch (args[0]) {
    case "join":
      if (!m.isGroup) return await dfail("group", m, conn);
      const playerName = m.sender;
      if (game.players.length < 2 && !game.players.includes(playerName)) {
        game.players.push(playerName);
        m.reply(`Selamat datang ${playerName}! Kamu telah bergabung dalam permainan Bingo.`);
      } else {
        m.reply("Maksimum pemain telah tercapai atau kamu sudah bergabung.");
      }
      break;
    case "start":
      if (!m.isGroup) return await dfail("group", m, conn);
      const playerRequestingStart = m.sender;
      if (game.players.length >= 2 && game.players.includes(playerRequestingStart)) {
        try {
          await game.initializeGame();
          await conn.reply(m.chat, "Permainan Bingo dimulai!\nCek kartu Bingo-mu di obrolan pribadi", m);
          for (const player of game.players) {
            const {
              buffer,
              message
            } = await game.getCardBuffer(player);
            await conn.sendFile(player, buffer, "", `${message}\nPilih dan kirimkan kode dalam grup contoh bingo 23 ( group )`, m);
          }
        } catch (error) {
          console.error("Error starting Bingo game:", error);
          m.reply("Gagal memulai permainan Bingo.");
        }
      } else {
        m.reply("Kamu tidak memenuhi syarat untuk memulai permainan. Pastikan ada setidaknya 2 pemain dan kamu telah bergabung.");
      }
      break;
    case "reset":
      if (!m.isGroup) return await dfail("group", m, conn);
      session.game.endGame();
      m.reply("Sesi permainan Bingo telah di-reset.");
      break;
    default:
      const number = parseInt(args[0]);
      if (isNaN(number)) {
        m.reply("Perintah tidak valid. Gunakan \"bingo join\" untuk bergabung, \"bingo start\" untuk memulai, atau \"bingo <nomor>\" untuk memanggil nomor.");
      } else {
        if (game.started) {
          try {
            const result = await game.callNumber(number, m.sender);
            if (result.startsWith("Belum giliranmu")) {
              m.reply(result);
            } else {
              await conn.reply(m.chat, result, m);
              const {
                buffer,
                message
              } = await game.getCardBuffer(m.sender);
              await conn.sendFile(m.sender, buffer, "", `${message}\nPilih dan kirimkan kode dalam grup contoh ${usedPrefix + command} 23 ( di grup )`, m);
            }
          } catch (error) {
            console.error(`Error calling number ${number} in Bingo game:`, error);
            m.reply("Gagal memanggil nomor. Silakan coba lagi.");
          }
        } else {
          m.reply("Permainan Bingo belum dimulai.");
        }
      }
  }
};
handler.help = ["bingo"];
handler.tags = ["game"];
handler.command = /^bingo$/i;
export default handler;