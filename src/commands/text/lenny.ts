import { Message } from 'discord.js';
import { CommandoClient, Command, CommandMessage } from 'discord.js-commando';

export class Lenny extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			name: 'lenny',
			group: 'text',
			memberName: 'lenny',
			description: 'Posts a lenny face to the channel',
			details: 'see description'
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		let channel = msg.channel;
		return msg.delete().then(() => channel.send('( ͡° ͜ʖ ͡°)'));
	}
}