"use strict";

const thinky = require('../dbModels/thinky.js');
const CustomCommand = require('../dbModels/customCommand.js');
const util = require('util');

let buildHelpMessage = (imageCommands, textCommands, soundCommands) => {
    let message = "Here\'s a list of my commands:\n\n" +
        "Command prefix (trigger) character is **\'~\'**\n\n" +
        "To create a custom command, use the following format:\n" +
        "\`\`\`xl\n" +
        "~createcommand ~[commandname]|[commandtype ex: image, text, sound]|[imageurl, responsetext, yturl]|[starttime (format: 00:00:00)]|[duration (07 (seconds))\n" +
        "Examples:\n\nsound:\n~createcommand ~test|sound|https://www.youtube.com/watch?v=dQw4w9WgXcQ|00:00:43|07\n" +
        "image:\n~createcommand ~imagetest|image|http://i.imgur.com/kTRCbX0.gif\n" +
        "\`\`\`\n\n" +
        "__**Sounds**__\n\n\`\`\`xl\n" +
        "cena: BOO-DO-DO-DOOOOOO\n" +
        "cenahorn: BOO-DO-DO-DOOOOOO (with airhorns)\n" +
        "yeslawd: YES LAWD\n" +
        "yesnigga: YES NIGGA\n" +
        "watermalone: Random \'watermalone\' \n" +
        "asslick\/dickpunch\/fuckenter: John Cena Quotes From \'Trainwreck\'\n" +
        "pawnch: Heavys Falcon Punch (TF2)\n" +
        "ohshit: Oh Shiiiiiiit\n" +
        "sob: \'You Son Of A Bitch\'\n" +
        "dinos: \'Who Killed The Dinos\?\'\n" +
        "fua: \'Fuck You Asshole\'\n" +
        "spine: \'Break Your God Damn Spine\'\n" +
        "stfu: \'SHUT UP\'\n" +
        "boris: \'I Am INVINCIBLE\'\n" +
        "bs: \'BULLSHIT\'\n" +
        "cocainum: \'COCAINUM\'\n" +
        "gfym: GRAPEFRUIT\n" +
        "dicksout: DICKS OUT FOR HARAMBE\n\`\`\`\n\n";

    if(soundCommands.length > 0){
        message += "__**Custom Sounds**__\n\n\`\`\`xl\n";

        for (let sound of soundCommands) {
            message += `${sound.commandText.slice(1)}\n`;
        }

        message += `\`\`\`\n\n`;
    }

    message += "__**Images**__\n\n\`\`\`xl\n" +
        "feelsgoodman: Feelsgoodman Meme\n" +
        "feelsbadman: Feelsbadman Meme\n" +
        "woody: Random \'Rapey Woody\' Meme\n" +
        "finishme: White Creamy Sauce\n" +
        "needful: Do The Needful\`\`\`\n\n";

    if (imageCommands.length > 0) {
        message += "__**Custom Images**__\n\n\`\`\`xl\n";

        for (let image of imageCommands) {
            message += `${image.commandText.slice(1)}\n`;
        }

        message += "\`\`\`\n\n";
    }

    message += "__**Text**__\n\n\`\`\`xl\n";
    message += "dongerino: Random ASCII Dick\n" +
        "salt: ASCII Salt\n" +
        "lenny: Lenny Face Meme\`\`\`\n\n";

    if (textCommands.length > 0) {
        message += "__**Custom Text**__\n\n\`\`\`xl\n";

        for (let text of textCommands) {
            message += `${text.commandText.slice(1)}\n`;
        }

        message += "\`\`\`\n";
    }

    return message;
};

let utilities = {
    "cuckhelp": {
        usage: "~cuckhelp",
        delete: false,
        type: "utilities",
        process: (bot, msg) => {
            CustomCommand.filter({serverId: msg.server.id}).run({readMode: 'majority'}).then((result) => {
                let imageCommands = result.filter((cmd) => { return cmd.commandType == 'image'});
                let textCommands = result.filter((cmd) => { return cmd.commandType == 'text'});
                let soundCommands = result.filter((cmd) => { return cmd.commandType == 'sound'});

                let message = buildHelpMessage(imageCommands, textCommands, soundCommands);

                bot.sendMessage(msg.author, message).then(() => {bot.reply(msg, `I've sent you my commands via PM`)});
            });
        }
    },
    "clear": {
        usage: "~clear (number of messages to remove from the chat log)",
        delete: true,
        type: "utilities",
        process: (bot, msg, commandOptions) => {
            let channel = msg.channel;

            console.log('commandOptions: ' + commandOptions);
            if (commandOptions.length > 2) {
                bot.reply("Incorrect usage! There are too many parameters for that command.");
                return;
            }

            let numberToDelete = Number(commandOptions) + 1; // add one so it deletes the clear message as well

            bot.getChannelLogs(channel, numberToDelete).then( messages => {
                bot.deleteMessages(messages).catch( err => {
                    console.log("there was a problem deleting messages: " + err);
                });
            }).catch(err => {
                console.log('error collecting messages for removal: ' + err);
            });
        }
    },
    "reloadcommands": {
        usage: "~reloadcommands",
        delete: true,
        type: "utilities",
        process: () => {
            const loadDbCommands = require('./loadDbCommands.js').loadDbCommands;

            loadDbCommands();
        }
    }
};

exports.utilities = utilities;