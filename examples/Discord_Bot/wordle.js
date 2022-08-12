import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import { Engine } from 'wordle-engine';
import DB from '../../Structures/Schemas/WordleDB';
const WordleEngine = new Engine();

export const status = {
    name: 'wordle',
    usage: '/wordle',
    permissions: ['SendMessages'],
    options: [
        {
            name: 'start',
            description: 'Start a new session',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'stop',
            description: 'Stop a session',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'guess',
            description: 'Guess a Word',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'guess',
                    description: 'Your guess',
                    type: ApplicationCommandOptionType.String,
                },
            ],
        },
    ],
    execute: async (client, message, interaction) => {
        const embed = new EmbedBuilder();

        switch (interaction.options.getSubcommand()) {
            case 'start': {
                const instance = WordleEngine.loadGame();
                const docs = await DB.findOneAndUpdate({ userId: interaction.user.id }, {
                    $set: {
                        answer: instance.answer,
                        TRIES_LEFT: instance.TRIES_LEFT,
                        gameState: instance.gameState,
                        description: [],
                    },
                }, {
                    new: true,
                    upsert: true,
                });

                embed
                    .setColor("#2F3136")
                    .setTitle("Wordle")
                    .setDescription(`
                        Guess the WORDLE in six tries.
                        Each guess must be a valid 5 letter word. Hit the enter button to submit.
                        After each guess, the color of the tiles will change to show how close your guess was to the word.

                        **TRIES LEFT:** ${docs.TRIES_LEFT}
                    `);
                
                interaction.reply({ embeds: [embed], ephemeral: true });
            }
            break;
            case 'stop': {
                WordleEngine.stopGame();
                await DB.findOneAndDelete({ userId: interaction.user.id });

                embed
                    .setColor("#2F3136")
                    .setDescription("The game has been stopped");
                
                interaction.reply({ embeds: [embed], ephemeral: true });
            }
            break;
            case 'guess': {
                const guess = interaction.options.getString('guess');
                const docs = await DB.findOne({ userId: interaction.user.id });

                if (!docs || !docs.gameState || docs.gameState === undefined) {
                    embed
                        .setColor("Red")
                        .setDescription("Please start a game before using this command");
                    
                    return interaction.reply({embeds: [embed]});
                }

                WordleEngine.guess(guess, docs.answer).then(async (data) => {
                    docs.TRIES_LEFT--;
                    docs.description.push(data);
                    await docs.save();
                    
                    if (data === "🟩 🟩 🟩 🟩 🟩") {
                        embed
                            .setColor("Green")
                            .setTitle(docs.description.join("\n"))
                            .setDescription(`
                                \n\n
                                🎉 Congratulations, You Won!
                                The word was **${docs.Answer}**
                            `)
                            .setFooter({ text: "You have 0 tries left" });

                        await DB.findOneAndDelete({ userId: interaction.user.id });
                        return interaction.reply({ embeds: [embed] });
                    } else if (data.includes("🟨")) {
                        embed
                            .setColor("Yellow")
                            .setTitle(docs.description.join("\n"))
                            .setFooter({ text: `You have ${docs.TRIES_LEFT} tries left!` });
                        return interaction.reply({ embeds: [embed] });
                    } else if (docs.TRIES_LEFT == 0) {
                        embed
                            .setColor(`Red`)
                            .setTitle(docs.description.join("\n"))
                            .setDescription(`
                                ❌ Out of Tries!
                                The word was **${docs.answer}**

                                Better Luck next time...
                            `)
                            .setFooter({ text: `You have ${docs.TRIES_LEFT} tries left!` });
                        
                        await DB.findOneAndDelete({ userId: interaction.user.id });
                        return interaction.reply({ embeds: [embed] });
                    } else {
                        embed
                            .setColor("#2F3136")
                            .setTitle(docs.description.join("\n"))
                            .setFooter({ text: `You have ${docs.TRIES_LEFT} tries left!` });
                        
                        return interaction.reply({ embeds: [embed] });
                    }
                }).catch((err) => {
                    if (!docs.gameState) {
                        embed
                            .setColor("Red")
                            .setDescription("Please start a game before guessing");
                        
                        return interaction.reply({ embeds: [embed] });
                    }
                    embed
                        .setColor("#2F3136")
                        .setDescription(`${err.reason}`)
                    interaction.reply({ embeds: [embed], ephemeral: true });
                });
            }
            break;
        }
    }
};
