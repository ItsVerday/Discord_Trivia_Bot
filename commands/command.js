const Discord = require("discord.js");

class Command {
    constructor(name) {
        this.name = name;
    }

    run(msg, args) {
        if (this.onExecute) {
            this.onExecute(msg, args);
        } else {
            console.warn(`No onExecute() method declared for command ${this.name}...`);
        }
    }
}

module.exports = {Command};