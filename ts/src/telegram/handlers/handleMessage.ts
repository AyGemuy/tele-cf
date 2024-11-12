import { tg } from '../lib/methods';
import { allCommands } from '../cmd';

export async function handleMessage(message: tgTypes.Message) {
    const [commandWithPrefix, ...promptArray] = message.text.split(' ');
    const command = commandWithPrefix.replace(/^[^\w]+/, '').toLowerCase();
    const prompt = promptArray.join(' ').trim();

    const matchedCommand = allCommands.find(cmd =>
        (Array.isArray(cmd.command) ? cmd.command.some(pattern =>
            typeof pattern === 'string' ? pattern.toLowerCase() === command :
            pattern instanceof RegExp ? pattern.test(command) : false
        ) : (typeof cmd.command === 'string' ? cmd.command.toLowerCase() === command :
            cmd.command instanceof RegExp ? cmd.command.test(command) : false))
    );

    if (matchedCommand) {
        // Start composing status
        await tg.sendChatAction({
            chat_id: message.chat.id,
            action: 'typing',
        });

        // Execute the command
        await matchedCommand.run({ prompt, chatId: message.chat.id, tg, messageId: message.message_id });

        // Stop composing status once the result is sent
        await tg.sendChatAction({
            chat_id: message.chat.id,
            action: 'cancel',
        });
    } else {
        // If no command matches, show available commands grouped by tags
        await tg.sendMessage({
            chat_id: message.chat.id,
            message_id: message.message_id,
            text: 'Perintah tidak ditemukan. Gunakan /start atau perintah yang valid.',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Tampilkan Perintah', callback_data: 'show_commands' }],
                    [{ text: 'Kembali', callback_data: 'back' }]
                ]
            }
        });
    }
}
