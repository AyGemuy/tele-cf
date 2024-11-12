import fetch from "node-fetch";

async function AcloudAi(inputText: string) {
  const options = {
    messages: [{
      role: "user",
      content: inputText
    }]
  };

  try {
    const payload = {
      model: "gemini-pro",
      messages: options?.messages,
      temperature: options?.temperature || .9,
      top_p: options?.top_p || .7,
      top_k: options?.top_k || 40
    };

    if (!payload.messages) throw new Error("Missing messages input payload!");
    if (!Array.isArray(payload.messages)) throw new Error("invalid array in messages input payload!");
    if (isNaN(payload.top_p)) throw new Error("Invalid number in top_p payload!");
    if (isNaN(payload.top_k)) throw new Error("Invalid number in top_k payload!");

    const response = await fetch("https://api.acloudapp.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "sk-9jL26pavtzAHk9mdF0A5AeAfFcE1480b9b06737d9eC62c1e"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!data.choices[0]?.message?.content) throw new Error("failed to get response message!");
    
    return {
      success: true,
      answer: data.choices[0]?.message.content
    };
  } catch (e) {
    return {
      success: false,
      errors: [e.message]
    };
  }
}

export default {
  help: 'Gunakan /acloudai diikuti dengan prompt untuk bertanya.',
  tags: 'ai',
  command: /^acloudai$/i,
  run: async function ({ prompt, chatId, tg }: { prompt: string; chatId: number; tg: any }) {
    try {
      const { success, answer, errors } = await AcloudAi(prompt);
      if (success) {
        return await tg.sendMessage({
          chat_id: chatId,
          text: answer
        });
      } else {
        return await tg.sendMessage({
          chat_id: chatId,
          text: `Error: ${errors.join(", ")}`
        });
      }
    } catch (error) {
      console.error('Error during run command:', error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  }
};
