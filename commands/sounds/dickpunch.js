const { Command } = require('discord.js-commando');
const PlaySound = require('../../helpers/playsound.js');
const CONSTANTS = require('../../constants.js');

module.exports = class DickPunch extends Command {
	constructor(client) {
		super(client, {
			name: 'dickpunch',
			group: 'sounds',
			memberName: 'dickpunch',
			description: `Play 'Dick Punch' in voice channel`,
			throttling: {
				usages: 3,
				duration: 7
			}
		});
	}

	async run(msg) {
		let soundArgs = {
			sound: CONSTANTS.DICKPUNCH,
			options: {
				quality: 'highest',
				volume: 0.5
			}
		};

		return new PlaySound().run(msg, soundArgs);
	}
};