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
        }, {
            name: 'stop',
            description: 'Stop a session',
            type: ApplicationCommandOptionType.Subcommand,
        }, {
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
        const { options } = interaction;
        switch (options.getSubcommand()) {
            case 'start':
                {
                    const instance = WordleEngine.loadGame();
                    const docs = await DB.findOneAndUpdate({
                        userId: interaction.user.id,
                    }, {
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
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(`#2F3136`)
                                .setTitle(`Wordle`)
                                .setDescription(`Guess the WORDLE in six tries.
                            Each guess must be a valid 5 letter word. Hit the enter button to submit.
                            After each guess, the color of the tiles will change to show how close your guess was to the word.

                            **TRIES_LEFT:** ${docs.TRIES_LEFT}
                            `)
                        ],
                        ephemeral: true,
                    });
                }
                break;
            case 'stop':
                {
                    WordleEngine.stopGame();
                    await DB.findOneAndDelete({ userId: interaction.user.id });
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(`#2F3136`)
                                .setDescription(`Stopped Game!`),
                        ],
                        ephemeral: true,
                    });
                }
                break;
            case 'guess':
                {
                    const guess = options.getString('guess');
                    const docs = await DB.findOne({ userId: interaction.user.id });
                    if (!docs) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(`Red`)
                                    .setTitle(`Please start the game before guessing`),
                            ],
                        });
                    }
                    else if (!docs.gameState || docs.gameState === undefined) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(`Red`)
                                    .setTitle(`Please start the game before guessing`),
                            ],
                        });
                    }
                    WordleEngine
                        .guess(guess, docs.answer)
                        .then(async (data) => {
                        docs.TRIES_LEFT--;
                        docs.description.push(data);
                        await docs.save();
                        if (data === "🟩 🟩 🟩 🟩 🟩") {
                            interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(`Green`)
                                        .setTitle(`${docs.description
                                        .join("\n")
                                        .toString()}`)
                                        .setDescription(`\n\n
												:tada: Congratulation, You Won!
												The word was **${docs.answer}**
												`)
                                        .setFooter({
                                        text: `You have ${0} tries left!`,
                                    }),
                                ],
                            });
                            return await DB.findOneAndDelete({ userId: interaction.user.id });
                        }
                        else if (data.includes("🟨")) {
                            return interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(`Yellow`)
                                        .setTitle(`${docs.description
                                        .join("\n")
                                        .toString()}`)
                                        .setFooter({
                                        text: `You have ${docs.TRIES_LEFT} tries left!`,
                                    }),
                                ],
                            });
                        }
                        else if (docs.TRIES_LEFT == 0) {
                            interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(`Red`)
                                        .setTitle(`${docs.description
                                        .join("\n")
                                        .toString()}`)
                                        .setDescription(`
												❌ Out of Tries!
												The word was **${docs.answer}**

												Better Luck next time...
												`)
                                        .setFooter({
                                        text: `You have ${docs.TRIES_LEFT} tries left!`,
                                    }),
                                ],
                            });
                            return await DB.findOneAndDelete({ userId: interaction.user.id });
                        }
                        else {
                            return interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(`#2F3136`)
                                        .setTitle(`${docs.description
                                        .join("\n")
                                        .toString()}`)
                                        .setFooter({
                                        text: `You have ${docs.TRIES_LEFT} tries left!`,
                                    }),
                                ],
                            });
                        }
                    })
                        .catch((err) => {
                        if (!docs.gameState) {
                            return interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(`Red`)
                                        .setTitle(`Please start the game before guessing`),
                                ],
                            });
                        }
                        interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(`#2F3136`)
                                    .setDescription(`${err.reason}`),
                            ],
                            ephemeral: true,
                        });
                    });
                }
                break;
        }
    }
};
