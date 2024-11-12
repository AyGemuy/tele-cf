import fetch from "node-fetch";

// Define CommandParams interface
interface CommandParams {
  prompt: string;
  chatId: number;
  tg: any;
}

// Type for the response of the executeCommand function
interface CompileResponse {
  stdout: string;
  stderr: string;
}

// Function to detect language from the code
function getLanguage(code: string): string {
  if (/^#!\s*\/bin\/bash/.test(code)) return "bash";
  if (/public\s+class\s+\w+/.test(code) && /public\s+static\s+void\s+main\s*\(/.test(code)) return "java";
  if (/def\s+\w+\s*\(/.test(code) || /import\s+\w+/.test(code) || code.includes("print(")) return "python";
  if (/^\s*#include\s+<.*?>/.test(code) || /namespace\s+\w+/.test(code)) return "cpp";
  if (/^\s*using\s+System/.test(code) || /namespace\s+\w+/.test(code)) return "csharp";
  if (/^\s*require\s*\(\s*['"][^'"]+['"]\s*\)/.test(code) || /function\s+\w+\s*\(/.test(code) || /console\.log\(/.test(code)) return "node";
  if (/^\s*import\s+\w+/.test(code) || /function\s+\w+\s*\(/.test(code)) return "typescript";
  return "unsupported";
}

// Function to execute the code using the Blackbox API
const executeCommand = async (code: string): Promise<CompileResponse | string> => {
  try {
    const language = getLanguage(code);
    const response = await fetch("https://apiv3-2l3o.onrender.com/compile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language: language,
        code: code,
        input: ""
      })
    });

    const result = await response.json();
    return result;
  } catch (e) {
    console.error("Error during compilation:", e);
    return "Terjadi kesalahan saat kompilasi.";
  }
}

// Telegram Bot Command Handler
export default {
  help: 'Gunakan /exec diikuti dengan perintah untuk diproses.',
  tags: 'tools',
  command: /^exec$/i,
  run: async ({ prompt, chatId, tg }: CommandParams): Promise<void> => {
    try {
      const result = await executeCommand(prompt);

      if (typeof result === "string") {
        // If result is an error message
        await tg.sendMessage({
          chat_id: chatId,
          text: result,
        });
      } else {
        // If result contains stdout or stderr
        const { stdout, stderr } = result;
        if (stderr) {
          await tg.sendMessage({
            chat_id: chatId,
            text: `Error: ${stderr}`,
          });
        } else {
          await tg.sendMessage({
            chat_id: chatId,
            text: `Output: ${stdout}`,
          });
        }
      }
    } catch (error) {
      console.error('Error handling /exec:', error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  },
};
