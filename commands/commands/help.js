const {Command} = require("../command");
const {register} = require("../commands");
const FileSystem = require("fs");

class HelpCommand extends Command {
    constructor() {
        super("help");
    }

    onExecute(msg, args) {
        FileSystem.readFile("commands/commands/help.txt", "utf8", (err, data) => {
            if (err) {
                throw err;
            }

            msg.channel.send(data);
        });
    }
}

register(HelpCommand);