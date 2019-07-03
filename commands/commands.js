const Discord = require("discord.js");
const Command = require("./command");

let registeredCommands = [];

function register(CommandClass) {
    registeredCommands.push(new CommandClass());
}

function execute(msg, args) {
    let name = args[0];
    args.splice(0, 1);

    for (let command of registeredCommands) {
        if (name == command.name) {
            command.run(msg, args);
            break;
        }
    }
}

module.exports = {execute, register};