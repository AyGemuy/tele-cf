import fetch from "node-fetch";

// List of model names
const modelNames = [
  "Cristiano Ronaldo", "Lionel Messi", "Ataturk", "Albert Einstein", "Aristotle",
  "Carl Sagan", "Isaac Asimov", "Confucius", "Frida Kahlo", "G.G. Marquez",
  "Ernest Miller Hemingway", "Lucius Annaeus Seneca", "Steve Jobs", "Nikola Tesla",
  "Socrates", "Thomas Edison", "Rosalind Franklin", "Gary Vaynerchuk", "Amelia Earhart",
  "Elon Musk", "Marcus Aurelius", "Ludwig van Beethoven", "Jane Goodall", "Rumi"
];

// Function to interact with the AskThee API
async function AskThee(prompt: string, index: number | null = null): Promise<string | null> {
  const name = index >= 0 && index < modelNames.length ? modelNames[index] : "Albert Einstein"; // Default to "Albert Einstein"
  
  const url = "https://askthee.vercel.app/api/generate";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
      Referer: "https://askthee.vercel.app/?ref=taaft&utm_source=taaft&utm_medium=referral"
    },
    body: JSON.stringify({
      name: name,
      question: prompt
    })
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

// Telegram Bot Command Handler
interface CommandContext {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /askthee --model=<model_id> <pertanyaan>. Misalnya: /askthee --model=1 Apa itu fisika?',
  tags: 'ai',
  command: /^askthee$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    // Extract model and question from the prompt
    const modelRegex = /--model=(\d+)/;
    const match = prompt.match(modelRegex);

    let index = null;
    if (match) {
      index = parseInt(match[1], 10); // Get model index from input
      // Remove the `--model=<index>` part to get the question
      prompt = prompt.replace(modelRegex, "").trim();
    }

    if (!prompt) {
      await tg.sendMessage({
        chat_id: chatId,
        text: "Tolong berikan pertanyaan setelah memilih model."
      });
      return;
    }

    const answer = await AskThee(prompt, index);

    if (answer) {
      await tg.sendMessage({
        chat_id: chatId,
        text: answer || "Tidak ada jawaban yang ditemukan."
      });
    } else {
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  }
};
