const request = require("request");
const unescape = require("unescape");
let important = require("../important");

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function formatTime(time) {
    let seconds = time % 60;
    seconds = seconds + "";
    while (seconds.length < 2) {
        seconds = "0" + seconds;
    }
    let minutes = Math.floor(time / 60);
    return `${minutes}:${seconds}`;
}

const answerCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

class TriviaSession {
    constructor(channel, {questionCount, timePerQuestion, difficulty}) {
        this.channel = channel;
        this.questionCount = questionCount || 10;
        this.timePerQuestion = Math.floor(timePerQuestion) || 15;
        this.difficulty = (difficulty || "any").toLowerCase();

        this.playerScores = {};
        this.questions = null;

        this.correctAnswerNumber = -1;
        this.answerCount = -1;
        this.questionNumber = -1;
        this.answers = null;
        this.playerAnswers = null;
        this.interval = null;
        this.timeLeft = null;

        this.questionsLoaded = false;
        this.loadQuestions(() => this.questionsLoaded = true);
    }

    getRequestURL() {
        return `https://opentdb.com/api.php?type=multiple&amount=${this.questionCount}${["easy", "medium", "hard"].indexOf(this.difficulty) > -1 ? `&difficulty=${this.difficulty}` : ""}`
    }

    loadQuestions(callback) {
        request(this.getRequestURL(), (err, resp, body) => {
            if (err) {
                throw err;
            }

            this.questions = JSON.parse(body).results;
            callback();
        });
    }

    startQuestion(index) {
        this.questionNumber = index;
        this.playerAnswers = {};
        this.timeLeft = this.timePerQuestion;

        let question = this.questions[index];

        let message = `**Question #${index + 1}** - Category: *${question.category}*, Difficulty: *${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}*

**${unescape(question.question, "all")}**
**Answer choices**:`;

        let correctAnswer = question.correct_answer;
        let answers = [correctAnswer];
        for (let answer of question.incorrect_answers) {
            answers.push(answer);
        }

        this.answerCount = answers.length;

        shuffleArray(answers);

        this.answers = answers;
        this.correctAnswerNumber = answers.indexOf(correctAnswer);

        for (let answerNumber in answers) {
            message += `
  \`${answerCharacters[answerNumber]}: ${unescape(answers[answerNumber], "all")}\``;
        }

        message += `

*Type the answer letter that you think is correct in the chat to submit your answer (Ex: A).* **Once you submit an answer, you cannot change it!**
**You have \`${formatTime(this.timePerQuestion)}\` to answer.**`;

        this.channel.send(message);

        this.interval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft == 0) {
                this.channel.send("**Time is up! You can no longer answer!**");

                clearInterval(this.interval);

                this.finishQuestion();
            } else if (this.timeLeft % 10 == 0) {
                this.channel.send(`**Hurry up!** You only have \`${formatTime(this.timeLeft)}\` left to answer!`);
            }
        }, 1000);
    }

    finishQuestion() {
        let correctPlayers = [];

        for (let playerID in this.playerAnswers) {
            let answerNumber = this.playerAnswers[playerID];

            let score = this.playerScores[playerID] || 0;
            if (answerNumber == this.correctAnswerNumber) {
                score++;

                correctPlayers.push(playerID);
            }

            this.playerScores[playerID] = score;
        }

        let pointMessage;

        if (correctPlayers.length == 0) {
            pointMessage = "No one got the answer, so no points for anyone this round...";
        } else if (correctPlayers.length == 1) {
            pointMessage = `Giving a point to **${important.userCache[correctPlayers[0]].username}**, since they are the only one who got it right.`;
        } else if (correctPlayers.length == 2) {
            pointMessage = `Giving a point each to **${important.userCache[correctPlayers[0]].username}** and **${important.userCache[correctPlayers[1]].username}**, since they both got it right.`;
        } else if (correctPlayers.length <= 5) {
            let players = correctPlayers.slice(0, correctPlayers.length - 1).map((userID) => `**${important.userCache[correctPlayers[userID]].username}**`).join(", ") + 
            `, and **${important.userCache[correctPlayers[correctPlayers.length - 1]].username}**`;

            pointMessage = `Giving a point to ${players}, because they all got it right.`;
        } else {
            pointMessage = `Giving a point to all players who got it right.`;
        }

        let question = this.questions[this.questionNumber];
        let message = `**Question #${this.questionNumber + 1} - Results**

**${unescape(question.question, "all")}**
**The correct answer was:** \`${answerCharacters[this.correctAnswerNumber]}: ${unescape(this.answers[this.correctAnswerNumber], "all")}\`

For this question, **${correctPlayers.length}**/**${Object.keys(this.playerAnswers).length}** players got the answer.
${pointMessage}`;

        this.channel.send(message);

        setTimeout(() => {
            if (this.questionNumber < this.questionCount - 1) {
                this.startQuestion(this.questionNumber + 1);
            } else {
                this.finish();
            }
        }, 5000);
    }

    finish() {
        let leaderboards = [];
        for (let userID in this.playerScores) {
            leaderboards.push({id: userID, score: this.playerScores[userID]});
        }

        leaderboards.sort((a, b) => b.score - a.score);

        let message = `**Game over!** The trivia game is finished, good job to anyone who played!

**Top players**:`;

        for (let index in leaderboards) {
            if (index >= 10) {
                break;
            }

            message += `
#${index - -1}: **${important.userCache[leaderboards[index].id].username}** - *${leaderboards[index].score} point(s)*`;
        }

        if (leaderboards.length == 0) {
            message += `
**Wait? There were no players?** :thinking:`;
        }

        message += `

To play again, use the \`t?start\` command.`;

        this.channel.send(message);

        important.sessions.splice(important.sessions.indexOf(this), 1);
    }

    go() {
        if (this.questionsLoaded) {
            this.startQuestion(0);
        } else {
            const interval = setInterval(() => {
                if (this.questionsLoaded) {
                    clearInterval(interval);
                    this.go();
                }
            }, 100);
        }
    }

    getAnswerNumber(message) {
        let strippedMessage = message.replace(/[^A-Za-z ]/, "");
        let index = answerCharacters.indexOf(strippedMessage.toUpperCase());

        return index < this.answerCount ? index : -1; 
    }

    recordAnswer(msg) {
        if (this.questionNumber == -1) {
            return false;
        }

        if (msg.channel.id == this.channel.id) {
            let author = msg.author;
            let userID = author.id;

            if (this.playerAnswers[userID] == undefined && this.timeLeft > 0) {
                let answerNumber = this.getAnswerNumber(msg.content);

                if (answerNumber != -1) {
                    this.playerAnswers[userID] = answerNumber;

                    this.channel.send(`**Answer recorded for ${author.username}**: \`${answerCharacters[answerNumber]}: ${unescape(this.answers[answerNumber], "all")}\``);

                    return true;
                }
            }
        }

        return false;
    }
}

module.exports = {TriviaSession};