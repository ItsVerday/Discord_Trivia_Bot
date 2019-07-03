const {Command} = require("../command");
const {register} = require("../commands");
const {beginSession} = require("../../sessions/sessions");

class StartCommand extends Command {
    constructor() {
        super("start");
    }

    onExecute(msg, args) {
        msg.channel.send("`Starting a new trivia game...`");
        if (args.length > 0) {
            beginSession(msg.channel, {
                questionCount: Number.parseInt(args[0]),
                timePerQuestion: Number.parseFloat(args[1]),
                difficulty: args[2]
            });
        } else {
            beginSession(msg.channel, {});
        }
    }
}

register(StartCommand);