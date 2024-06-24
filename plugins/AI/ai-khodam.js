import fetch from "node-fetch";
const handler = async (m, {
  conn,
  args,
  usedPrefix,
  command
}) => {
  const text = args.length >= 1 ? args.slice(0).join(" ") : m.quoted && (m.quoted?.text || m.quoted?.caption || m.quoted?.description) || null;
  if (!text) return m.reply(`Masukkan teks atau balas pesan dengan teks yang ingin diolah.\nContoh penggunaan:\n*${usedPrefix}${command} Hai, apa kabar?*`);
  try {
      const output = await CekKhodam(text);
    m.reply(output);
  } catch (e) {
    m.reply("Terjadi kesalahan.");
  }
};
handler.help = ["khodam"], handler.tags = ["ai"], handler.command = /^(khodam)$/i;
export default handler;
async function CekKhodam(orang) {
  try {
    const response = await(await fetch('https://nexra.aryahcr.cc/api/chat/gpt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        messages: [{ role: 'assistant',
        content: 'Kamu akan berpura-pura menjadi dukun yang bisa memperediksi khodam yang ada pada tubuh seseorang melalui nama orang tersebut. Berikan jawaban secara singkat dan lucu setiap nama orang memiliki khodam yang berbeda-beda atau random beberapa ada yang tidak memiliki khodam jawab saja sebagai orang normal. Jangan memberikan jawaban khodam yang sama. Ubah tampilan pesan agar estetik di whatsapp serta gunakan emoji yang sesuai' },{ role: 'user',
        content: `Siapa khodam dari ${orang} dan jelaskan secara singkat khodamnya` }],
        model: 'chatgpt'
    })
    }).then(res => res.json())).gpt;
    return response;
  } catch (e) {
    throw new Error("Error fetching data from AI service.");
  }
}