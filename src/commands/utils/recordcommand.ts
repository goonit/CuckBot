const CustomCommand = require('../../dbModels/customCommand.js');
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');
const SoundCommand = require('../../helpers/dbSoundCommand.js');

import { Message, TextChannel } from 'discord.js';
import { CommandoClient, Command, CommandMessage } from 'discord.js-commando';
import { ICustomCommand } from '../../helpers/ICustomCommand';
import { format } from 'date-fns';

const chalk = require('chalk');
const c = new chalk.constructor({ enabled: true });

let channelC = c.green.bold;
let userC = c.cyan.bold;
let warningC = c.yellow.bold;
let errorC = c.red.bold;
let botC = c.magenta.bold;

export class RecordCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			name: 'recordcommand',
			group: 'utils',
			memberName: 'recordcommand',
			description: 'records a new command and saves it to the database',
			args: [
				{
					key: 'commandtrigger',
					label: 'commandtrigger',
					prompt: 'What would you like the command trigger text to be?',
					type: 'string',
					infinite: false
				}
			]
		});
	}

	// todo: Needs to clean up (delete) the message that created the command
	public async run(
		msg: CommandMessage,
		args: any
	): Promise<Message | Message[]> {
		if (await this.commandExists(args.commandtrigger, msg.guild.id)) {
			msg.reply(`Command '${args.commandtrigger}' already exists!`);
			return;
		}

		if (!args.commandtrigger.startsWith('~')) {
			msg.reply(`The command must start with a prefix of '~'`);
			return;
		}

		args.commandtrigger = args.commandtrigger.toLowerCase();

		let createDate = format(new Date(), 'MM/DD/YYYY hh:mm:ss');

		let customCmd: ICustomCommand = new CustomCommand({
			serverId: msg.guild.id,
			commandText: args.commandtrigger,
			createDate: createDate,
			createUser: msg.author.username,
			commandType: 'recorded'
		});

		let customCmdSlow: ICustomCommand = new CustomCommand({
			serverId: msg.guild.id,
			commandText: `${args.commandtrigger}-slow`,
			createDate: createDate,
			createUser: msg.author.username,
			commandType: 'recorded'
		});

		let customCmdFast: ICustomCommand = new CustomCommand({
			serverId: msg.guild.id,
			commandText: `${args.commandtrigger}-fast`,
			createDate: createDate,
			createUser: msg.author.username,
			commandType: 'recorded'
		});

		msg.delete();

		await this.newRecordedCommand(
			msg,
			args,
			customCmd,
			customCmdSlow,
			customCmdFast
		);
	}

	private async newRecordedCommand(
		msg: CommandMessage,
		args: any,
		customCmd: ICustomCommand,
		customCmdSlow: ICustomCommand,
		customCmdFast: ICustomCommand
	) {
		let cmdName: string = args.commandtrigger;
		let cmdNameSlow: string = `${args.commandtrigger}-slow`;
		let cmdNameFast: string = `${args.commandtrigger}-fast`;
		let cmdNoTrigger: string = cmdName.slice(1);
		let cmdSlowNoTrigger: string = cmdNameSlow.slice(1);
		let cmdFastNoTrigger: string = cmdNameFast.slice(1);

		// download the video via ytdl, then write that to a video file.
		// After that is done, then we run that video file through the ffmpeg
		// lib to create the small snippet video we need, save that to a new file
		// and delete the original video downloaded via fs.unlink()

		// todo: move resources path into a config file or something

		const voiceChannel = msg.member.voiceChannel;

		if (!voiceChannel) {
			return msg.reply(`Please be in a voice channel first`);
		}

		let connection = await voiceChannel.join();

		const receiver = connection.createReceiver();
		if (!receiver) {
			console.log(
				`${errorC(
					`There was an error trying to encode the command: ${cmdName}`
				)}`
			);
		}

		const writable = fs.createWriteStream(`${__dirname}/temp.raw`);
		let stream = receiver.createPCMStream(msg.author);

		stream.on('data', (chunk) => {
			writable.write(chunk, () => {
				console.log(`Wrote ${chunk.length} bytes of data to output file`);
			});
		});

		writable.on('error', (error: any) => {
			console.error(`error has occurred: ${error}`);
		});

		stream.on('end', () => {
			connection.disconnect();
			msg.reply(`Converting command -> audio`);
			Promise.all([
				this.doFfmpegWork(
					cmdNameSlow,
					cmdSlowNoTrigger,
					'48k',
					customCmdSlow,
					msg
				),
				this.doFfmpegWork(cmdName, cmdNoTrigger, '96k', customCmd, msg),
				this.doFfmpegWork(
					cmdNameFast,
					cmdFastNoTrigger,
					'192k',
					customCmdFast,
					msg
				)
			]);
		});
	}

	private async doFfmpegWork(
		cmdName: string,
		cmdNoTrigger: string,
		audioBitRate: string,
		customCmdObj: any, // * has to stay as any because no ts support from thinky :(
		msg: CommandMessage
	) {
		// 96k bitrate for normal voice. (half the 'regular' rate with is low-pitched to begin with) ffmpeg -f s16le -i input.raw -filter:a "asetrate=96k" -c:a libmp3lame output.mp3
		// regular for low voice () ffmpeg -f s16le -i input.raw -c:a libmp3lame output.mp3
		// high voice is 192k (double the normal rate) ffmpeg -f s16le -i input.raw -filter:a "asetrate=192k" -c:a libmp3lame output.mp3

		// create a child process to run the ffmpeg command to convert the
		// downloaded file to an mp3 and store it on the server
		console.log(
			`calling ffempegwork with name: ${cmdName} and bitrate: ${audioBitRate}`
		);
		let resourcesPath: string = path.resolve('resources/');
		let tempFileDir: string = `${__dirname}/temp.raw`;
		let channel: TextChannel = msg.channel as TextChannel;

		let childProcess = exec(
			`ffmpeg -f s16le -i ${tempFileDir} -filter:a "asetrate=${audioBitRate}" -c:a libmp3lame ${resourcesPath}/${cmdNoTrigger}${
				msg.guild.id
			}.mp3 -report`,
			(error: any, stderr: any) => {
				if (error !== null && stderr !== null) {
					console.log(
						`${channelC(` # ${channel.name}`)}: ${botC(`@CuckBot`)} - ${errorC(
							`There was an error trying to encode the command: ${cmdName}`
						)}`
					);
					console.log(`${errorC(`error: ${error}`)}`);
					RecordCommand.removeFile(tempFileDir);
				}
			}
		);

		// event to catch when ffmpeg is finished converting
		childProcess.on('exit', (code: number) => {
			if (code !== 0) {
				console.log(`${errorC(`ffmpeg exited with an error. Uh oh.`)}`);
				msg.reply(`Shit hit the fan when trying to convert to an audio file`);

				RecordCommand.removeFile(tempFileDir);
				RecordCommand.removeFile(`${resourcesPath}\\${cmdNoTrigger}.mp3`);

				return;
			}

			// making sure the file was created successfully
			fs.stat(
				`${resourcesPath}/${cmdNoTrigger}${msg.guild.id}.mp3`,
				async (err: any, stats: any) => {
					if (err || !stats.isFile()) {
						console.log(
							`${channelC(` # ${channel.name}`)}: ${botC(
								`@CuckBot`
							)} - ${errorC(
								`The file cannot be found after ffmpeg conversion: ${cmdNoTrigger}${
									msg.guild.id
								}.mp3`
							)}`
						);
						console.log(`Removing temp file.`);

						RecordCommand.removeFile(`${tempFileDir}`);
						msg.reply(
							'Something happened when trying to find the converted audio file.'
						);

						// return because we don't want the database command to be created if the sound file to play cannot be found
						return;
					}

					let result = await customCmdObj.save();

					console.log(
						`${channelC(` # ${channel.name}`)}: ${botC(
							`@CuckBot`
						)} - ${warningC(result.commandText)} was created by ${userC(
							msg.author.username
						)}`
					);

					// Chop off the leading ~ for commando
					customCmdObj.commandText = customCmdObj.commandText.slice(1);

					this.client.registry.registerCommand(
						new SoundCommand(this.client, customCmdObj)
					);

					msg.reply(
						`New command '${cmdName}' was successfully created and is now ready to be used!`
					);
				}
			);
		});
	}

	private async commandExists(
		trigger: string,
		serverId: string
	): Promise<Boolean> {
		let result: ICustomCommand[] = CustomCommand.filter({
			serverId,
			commandText: trigger
		}).run({ readMode: 'majority' });

		return result.length > 0;
	}

	private static removeFile(file: string) {
		fs.unlinkSync(file);
	}
}
