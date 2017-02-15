const { Command } = require('discord.js-commando');
const PlaySound = require('../../helpers/playsound.js');
const CONSTANTS = require('../../constants.js');

module.exports = class Fua extends Command {
	constructor(client) {
		super(client, {
			name: 'fua',
			group: 'sounds',
			memberName: 'fua',
			description: `Play 'Fuck you asshole' in voice channel`,
			throttling: {
				usages: 3,
				duration: 7
			}
		});
	}

	async run(msg) {
		let soundArgs = {
			sound: CONSTANTS.FUA,
			options: {
				quality: 'highest',
				volume: 0.5
			}
		};

		return new PlaySound().run(msg, soundArgs);
	}
};
