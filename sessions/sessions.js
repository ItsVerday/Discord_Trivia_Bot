const {TriviaSession} = require("./trivia-session");
let important = require("../important");

let sessions = [];

function beginSession(channel, options) {
    let session = new TriviaSession(channel, options);
    sessions.push(session);
    session.go();
}

function recordAnswer(msg) {
    for (let session of sessions) {
        if (session.recordAnswer(msg)) {
            return true;
        }
    }

    return false;
}

important.sessions = sessions;

module.exports = {beginSession, recordAnswer, sessions};