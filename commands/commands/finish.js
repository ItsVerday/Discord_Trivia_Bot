const {Command} = require("../command");
const {register} = require("../commands");
let important = require("../../important");

class StartCommand extends Command {
    constructor() {
        super("finish");
    }

    onExecute(msg, args) {
        let channel = msg.channel;

        for (let index = important.sessions.length - 1; index >= 0; index--) {
            if (important.sessions[index].channel.id == channel.id) {
                important.sessions.splice(index, 1);
            }
        }

        channel.send("**All games in this channel have been stopped.**");
    }
}

register(StartCommand);