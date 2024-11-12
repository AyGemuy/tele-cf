import { tg } from '../lib/methods';
import { allCommands } from '../cmd';

export async function handleCallbackQuery(callbackQuery: tgTypes.CallbackQuery) {
    const { data, message } = callbackQuery;
    const messageId = message?.message_id;
    const chatId = message?.chat.id;

    if (messageId && chatId) {
        // Start composing (typing status)
        await tg.sendChatAction({ chat_id: chatId, action: 'typing' });

        if (data === 'accept_rules') {
            await tg.editMessageReplyMarkup({ chat_id: chatId, message_id: messageId, reply_markup: undefined });
            await tg.sendMessage({ chat_id: chatId, text: 'Terima kasih telah menerima aturan saya.' });
        }

        if (data === 'back') {
            await tg.editMessageReplyMarkup({ chat_id: chatId, message_id: messageId, reply_markup: undefined });
            await tg.sendMessage({
                chat_id: chatId,
                text: 'Anda kembali ke menu utama.',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Tampilkan Perintah', callback_data: 'show_commands' }, { text: 'Keluar', callback_data: 'exit' }]
                    ]
                }
            });
        }

        if (data === 'show_commands') {
            await tg.editMessageReplyMarkup({ chat_id: chatId, message_id: messageId, reply_markup: undefined });

            // Group commands by tags, supporting array, string, or comma-separated string
            const groupedCommands = allCommands.reduce((acc, command) => {
                // Ensure command has the expected structure
                if (!command || !command.help || !command.tags) return acc;

                let tags = command.tags;

                // Normalize tags to array format
                if (typeof tags === 'string') {
                    tags = tags.split(',').map(tag => tag.trim()); // If it's a comma-separated string
                } else if (!Array.isArray(tags)) {
                    tags = ['LAINNYA']; // Default tag if no tags are provided or in an unexpected format
                }

                // Extract command and description without split('\n')
                const [commandText, ...descriptionParts] = command.help.split(' ');
                const description = descriptionParts.join(' '); // Join remaining parts for description

                // Add command to corresponding tags
                tags.forEach(tag => {
                    acc[tag] = acc[tag] || [];
                    acc[tag].push({
                        command: commandText, // Use the extracted command
                        help: description,    // Remaining text as description
                    });
                });

                return acc;
            }, {});

            // Format command list in aesthetic style with uppercase tags
            let commandsText = '';
            Object.keys(groupedCommands).forEach((tag) => {
                commandsText += `${tag.toUpperCase()}`; // Bold tag name and uppercase it
                commandsText += `\n------------------\n`; // Add separator after each tag group
                groupedCommands[tag].forEach((command, idx) => {
                    commandsText += `${idx + 1}. ${command.command} - ${command.help}\n`; // Display command and description
                });
                commandsText += `\n------------------\n`; // Add separator after each tag group
            });

            await tg.sendMessage({
                chat_id: chatId,
                text: commandsText,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Kembali', callback_data: 'back' }, { text: 'Keluar', callback_data: 'exit' }]
                    ]
                }
            });
        }

        if (data === 'exit') {
            await tg.sendMessage({ chat_id: chatId, text: 'Sampai jumpa!', reply_markup: undefined });
        }

        // Stop composing (cancel typing status)
        await tg.sendChatAction({ chat_id: chatId, action: 'cancel' });
    }
}
