const Discord = require("discord.js");
const {execute} = require("./commands/commands");
const {recordAnswer} = require("./sessions/sessions");
const dotenv = require('dotenv');
dotenv.config();

let important = require("./important");

let client = new Discord.Client();
const prefix = "t?";

client.on("ready", () => {
    console.log("I am ready!");

    let commands = [
        require("./commands/commands/help"),
        require("./commands/commands/finish"),
        require("./commands/commands/start")
    ];
});

client.on("message", (msg) => {
    if (msg.author.bot) {
        return;
    }

    if (!important.userCache[msg.author.id]) {
        important.userCache[msg.author.id] = msg.author;
    }

    if (msg.content.startsWith(prefix)) {
        let args = msg.content.substring(prefix.length).split(" ");

        execute(msg, args);
    } else {
        recordAnswer(msg);
    }
});

client.login(process.env.BOT_TOKEN);

important.client = client;