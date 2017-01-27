'use strict';

const fs      = require('fs');
const Clapp   = require('./modules/clapp-discord');
const cfg     = require('../config.js');
const pkg     = require('../package.json');
const Discord = require('discord.js');
var   bot     = new Discord.Client();
const os      = require('os');
const byline  = require('byline');
const EventEmitter = require('events');
const validURL = require('valid-url');
const commands = ["/keyword", "/dkeyword", "/keywords", "/suggest"];
const commandUsage = ["Add a keyword for the bot to respond to",
			"Delete a keyword previously defined",
			"List all keywords",
			"Suggest a feature to be implemented for the bot to use"
			];
const adminCommands = ["/purge"];
const adminCommandUsage = ["Delete # most recent messages"];

var connguilds = new Array();
var adminroles = new Map();
//each entry has id of guild as key, id of role as entry

var sendNotif = new EventEmitter();
var app = new Clapp.App({
	name: cfg.name,
	desc: pkg.description,
	prefix: cfg.prefix,
	version: pkg.version,
	onReply: (msg, context) => {
		// Fired when input is needed to be shown to the user.

		context.msg.reply('\n' + msg).then(bot_response => {
			if (cfg.deleteAfterReply.enabled) {
				context.msg.delete(cfg.deleteAfterReply.time)
					.then(msg => console.log(`Deleted message from ${msg.author}`))
					.catch(console.log);
				bot_response.delete(cfg.deleteAfterReply.time)
					.then(msg => console.log(`Deleted message from ${msg.author}`))
					.catch(console.log);
			}
		});
	}
});

// Load every command in the commands folder
fs.readdirSync('./lib/commands/').forEach(file => {
	if (file.indexOf('.') != 0)
		app.addCommand(require("./commands/" + file));
});

bot.on('message', msg => {
	// Fired when someone sends a message
	if (app.isCliSentence(msg.content)) {
		app.parseInput(msg.content, {
			msg: msg
			// Keep adding properties to the context as you need them
		});
	}
 try{
 if (connguilds.findIndex(function (element, index, array) {
	if (msg.guild == null)
		throw "msg.guild.id is null in connguilds.findIndex";
	if (element == msg.guild.id)
		return true;
	return false;
	}) < 0 ) { // new guild detected
	connguilds.push(msg.guild.id);
	var roles = msg.guild.roles;
	var rolekeys = roles.keyArray();
	var added = false;
	for (var j = 0; j < rolekeys.length; j++) {
		var currole = roles.get(rolekeys[j]);
		if (currole.name.toLowerCase() === "buttbot-admin") {
			adminroles.set(msg.guild.id, rolekeys[j]);
			added = true;
		}
	}
	console.log("Updated connected guilds: " + connguilds);
	console.log("Updated admin roles: " + Array.from(adminroles));
	if (!added) {
		adminrole = new Role();
		adminrole.edit({
			name: 'buttbot-admin',
			guild: msg.guild,
			managed: true
		})
		.then(console.log("Created new admin role for guild " + msg.guild.id))
		.catch(function (err) { console.log("Something went wrong when creating role: " + err); });
	}
	fs.access('lib/keyword/'+msg.guild.id, fs.constants.W_OK, function (err) {
		if (err) {
			fs.mkdir('lib/keyword/'+msg.guild.id, '0666', function (err) {
				if (err) console.log(err);
				console.log("Made new keyword directory " + msg.guild.id);
			});
		}
	});
	}
	} catch (e) { console.log("Something went wrong: " + e); }
 if (msg.author.username != "buttbot") {
	if (msg.content.indexOf('/keyword ') === 0) {
		var cmd = msg.content;
		var keyd = cmd.split("\"");
		if (!(keyd[1] == null || keyd[2] == null )) {
			var keyd2 = keyd[2].split(" ");
			var usrmsg = keyd[1]; //this is the thing in quotation marks
			var kepdel = keyd2[1]; //this is keep or delete
			if (kepdel == null || (kepdel.toLowerCase() != "keep" && kepdel.toLowerCase() != "delete" /*&& kepdel.toLowerCase() != "edit"*/))  {
				sendNotif.emit('sendmsg', msg.channel, "usage: /keyword \"keywords\" keep/delete"/*edit*/ + " text to respond"/*/edit*/+" with");
			}
			else  {
				var replmsg = "";
				for (var x in keyd2)
				{
					if (x > 1) {
						replmsg = replmsg.concat(keyd2[x]);
						replmsg = replmsg.concat(" ");
					}
				}
	replmsg = replmsg.concat(os.EOL);
	fs.writeFile('lib/keyword/'+msg.guild.id+'/'+usrmsg.toLowerCase()+'['+kepdel.toLowerCase()+']', replmsg, { flag: 'a' },function (err, data) {
		if (err) {
			fs.access('lib/keyword/'+msg.guild.id, fs.constants.W_OK, function (err) {
				if (err) {
					fs.mkdir('lib/keyword/'+msg.guild.id, '0666', function (err) {
						if (err) {
							return console.log(err);
						}});
					}
				});
			fs.writeFile('lib/keyword/'+msg.guild.id+'/'+usrmsg.toLowerCase()+'['+kepdel.toLowerCase()+']', replmsg, {flag: 'a'}, function (err, data) {
				if (err) return console.log(err);
			});
		}
	});
			 	sendNotif.emit('sendmsg', msg.author, "Keyword successfully added: " + usrmsg + ". " + kepdel.toLowerCase() + " the message, then say " + replmsg);
			}
		}
		else  {
			sendNotif.emit('sendmsg', msg.channel, "usage: /keyword \"keywords\" keep/delete"/*/edit*/+" text to respond"/*/edit*/ + " with");
		}
	}
	else if (msg.content.indexOf('/dkeyword') === 0) {
	var cmd = msg.content;
	var keyd = cmd.split("\"");
	if (keyd[1] == null) {
		sendNotif.emit('sendmsg', msg.channel, "usage: /dkeyword \"keywords\"");
	}
	else {
		fs.readdir('lib/keyword/'+msg.guild.id,'utf8', function (err, files) {
			if (err) return console.log(err);
			for (var i = 0; i < files.length; i++) {
				var parsed = files[i].split("[");
				if (keyd[1].toLowerCase() == parsed[0]) {
					fs.unlink('lib/keyword/'+msg.guild.id+'/'+files[i], function (err) {
						if (err) return console.log(err);
						else sendNotif.emit('sendmsg', msg.channel, "successfully removed keyword: " + keyd[1]);
					});
				}
			}
		});
	}
	}
	else if (msg.content.indexOf('/keywords') === 0) {
	fs.readdir('lib/keyword/'+msg.guild.id, 'utf8', function (err, files) {
		if (err) return console.log(err);
		var message = "Keywords: \n";
		for (var i = 0; i < files.length; i++) {
			var parsed = files[i].split("[");
			message = message+parsed[0]+'\n';
		}
		sendNotif.emit('sendmsg', msg.author, message);
	});
	}
	/*else if (msg.content.indexOf('/voicecommand ') === 0) {
		var cmd = msg.content;
		var keyd = cmd.split("\"");
		if (!(keyd[1] == null || keyd[2] == null )) {
	var keyd2 = keyd[2].split(" ");
	var usrmsg = keyd[1]; //this is the thing in quotation marks
	var url = keyd2[1];
	if (!validURL.isUri(url) || usrmsg == null) return sendNotif.emit('sendmsg', msg.channel, "usage: /voicecommand \"command\" [youtube link of thing to play]");
	fs.open('lib/voicekeyword/'+msg.guild.id+'/'+usrmsg.toLowerCase(), { flag: 'wx' }, function (err, fd) {
		if (err) {
			if (err.code === "EEXIST") { //file exists
				fs.write(fd, url, function (err) {
					if (err) {
						sendNotif.emit('sendmsg', msg.channel, "Something went wrong");
						return console.log(err);
					}
				});
				return sendNotif.emit('sendmsg', msg.channel, "Voice command already existed, overwriting... " + usrmsg + ": " + url);
			}
			else {
				sendNotif.emit('sendmsg', msg.channel, "Something went wrong");
				return console.log(err);
			}
		}
		fs.write(fd, url, function (err) {
			if (err) {
				sendNotif.emit('sendmsg', msg.channel, "Something went wrong");
				return console.log(err);
			}
		});
		return sendNotif.emit('sendmsg', msg.channel, "New voice command added: " + usrmsg + ": " + url);
	});
			}
		}
		else  {
			sendNotif.emit('sendmsg', msg.channel, "usage: /voicecommand \"command\" [youtube link of thing to play]");
		}
	}*/
	else if (msg.content.indexOf('/suggest') === 0) {
			var cmd = msg.content;
			var suggestion = cmd.split(" ");
			if (suggestion[1] == null) {
		sendNotif.emit('sendmsg', msg.channel, "usage: /suggest suggestion");
		return;
	}
				var suggestionMsg = "";
	for (var i = 1; i < suggestion.length; i++)
		suggestionMsg = suggestionMsg + " " + suggestion[i];
				suggestionMsg = "-" + suggestionMsg+os.EOL;
	fs.access('/mnt/c/Users/dqber/lib/ideas.txt', fs.constants.W_OK, function (err) {
		if (err) {
			return console.log(err);
		}
		fs.writeFile('/mnt/c/Users/dqber/lib/ideas.txt', suggestionMsg, {flag:'a'}, function(err, data) {
			if (err) 
				return console.log(err);
			sendNotif.emit('sendmsg', msg.channel, "Suggestion added successfully");
		});
		
	});
	}
	else if (msg.content.indexOf('/commands') === 0) {
	var message = ""
	for (var i = 0; i < commands.length; i++) 
		message = message+commands[i] + ": " + commandUsage[i] + os.EOL;
	if (msg.member.roles.has(adminroles.get(msg.guild.id))) {
		message = message + "Admin Commands: " + os.EOL;
		for (var i = 0; i < adminCommands.length; i++)
			message = message+adminCommands[i] + ": " + adminCommandUsage[i] + os.EOL;
	}
	sendNotif.emit('sendmsg', msg.author, message);
	}
	else if (msg.member.roles.has(adminroles.get(msg.guild.id))) { //admin only commands
	if (msg.content.indexOf('/purge ') === 0) {
		var numDel = msg.content.split('/purge ')[1];
		if (numDel == null) 
			return sendNotif.emit('sendmsg', msg.channel, "usage: /purge [# of messages to delete]");
		if (isNaN(parseInt(numDel, 10)))
			return sendNotif.emit('sendmsg', msg.channel, "usage: /purge [# of messages to delete]");
		if (parseInt(numDel, 10) < 1)
			return sendNotif.emit('sendmsg', msg.channel, "# must be larger than 0");
		msg.channel.bulkDelete(parseInt(numDel, 10) + 1)
		.then(function (map) { sendNotif.emit('delsuc', map.size + " messages were deleted"); })
		.catch(function (reason) { sendNotif.emit('delerr', reason); });
	}
	}
	if (msg.content.indexOf('/') != 0) {
	 fs.readdir('lib/keyword/'+msg.guild.id, 'utf8', function (err, files) {
		if (err) return console.log(err);
	for (var i = 0; i < files.length; i++) {
		var parsed = files[i].split("[");
		var channel = msg.channel;
		//parsed[0] = message, parsed[1] = keep/delete
		if (msg.content.toLowerCase().search(parsed[0]) > -1) {
			var mesg = fs.readFileSync('lib/keyword/'+msg.guild.id+'/'+files[i], {encoding: 'utf8'}); 
			if (parsed[1].search('delete') > -1) {
				sendNotif.emit('delmsg', msg);
			}
			//cant currently edit messages :(
			/*if (parsed[1].search('edit') > -1) {
				var part = msg.content.split(parsed[0]);
				if (!part[0] && !part[1])
					mesg = mesg;
				else if (!part[0]) {
					for (var i = 1; i < part.length; i++)
						mesg += " " + part[i];
				}
				else if (!part[1]) 
					mesg = part[0]+" " + mesg;
				else {
					mesg = part[0]+" "+mesg;
					for (var i = i; i < part.length; i++)
						mesg += " " + part[i];
				}
				msg.edit(mesg)
				.then(function (message) { sendNotif.emit('editsuc', message); })
				.catch(function (reason) { sendNotif.emit('editerr', reason); });
			}
			else*/
				sendNotif.emit('sendmsg', msg.channel, mesg);
		}	
	}
		});
	} 		
}
});

bot.login(cfg.token).then(() => {
	console.log('Running!');
});

bot.on("disconnect", function() {
	console.log("disconnect detected");
	bot_reset(bot);
});

process.stdin.on('readable', function () {
	var input = process.stdin.read();
	if (input === null) return;
	if (input instanceof Buffer) input = input.toString();
	var done = new EventEmitter();
	if (input.search("res") >= 0) {
		bot_reset(bot);
	}
	if (input.search("exit") >= 0) {
		bot.destroy()
		.then( function () { console.log("logout success"); process.exit(0); })
		.catch( function (reason) { console.log("logout failure " + reason); process.exit(1); });
	} 
	else if (input.search("say") >= 0) {
		var parsed = input.split("say");
		var channel;
		var saymsg;
		if (input.search("chan") >= 0) {
			channel = parsed[1].split("chan ")[1].split(" ")[0];
			saymsg = parsed[1].split(channel)[1];
		}
		else {
			channel = undefined;
			saymsg = parsed[1];
		}
		bot.channels.forEach( function (chan, key, map) {
			if (chan.type == "text") {
				if (channel == null)
					sendNotif.emit('sendmsg',  chan, saymsg);
				else if (chan.name.search(channel) >= 0) 
					sendNotif.emit('sendmsg', chan, saymsg);
			}
		});
	}
});
sendNotif.on('sendmsg', function (channel, message) {
	channel.sendMessage(message)
	.then(function (message) { sendNotif.emit('sendsuc', message); }, 
	function (reason) { sendNotif.emit('senderr', reason); });
});
sendNotif.on('delmsg', function (message) {
	message.delete()
	.then(function (message) { sendNotif.emit('delsuc', message); },
	function (reason) { sendNotif.emit('delerr', reason); });
});
sendNotif.on('senderr', function (reason) {
	console.log("CANNOT SEND " + reason);
});
sendNotif.on('sendsuc', function (message) {
	console.log("SENT " + message);
});

/* cant currently edit messages
sendNotif.on('editsuc', function (message) {
	console.log("successfully edited " + message);
});
sendNotif.on('editerr', function (reason) {
	console.log("error editing message reason: " + reason);
});
*/

sendNotif.on('delsuc', function (message, channel) {
	console.log("DELETED " + message);
});
sendNotif.on('delerr', function (reason, channel) {
	console.log("CANNOT DELETE " + reason );
});


function bot_reset(thebot, waittime) {
	if (typeof(waittime) === 'undefined') waittime = 5; //how long to wait if reconnect failure, gets increased by 5 each failure
	else waittime += 5;	
	thebot.destroy()
	.then( function () {
		console.log("logout success");
		thebot.login(cfg.token)
		.then( function () {
			console.log("reconnect success");
		})
		.catch( function (reason) {
			console.log("reconnect failure " + reason + "\nwaiting for " + waittime + " seconds...");
			setTimeout( bot_reset(thebot, waittime), waittime*1000);
		});
	})
	.catch( function (reason) {
		console.log("logout failure " + reason);
	});
}
