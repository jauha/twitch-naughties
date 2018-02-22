'use strict';

const fs = require("fs");
const tmi = require("tmi.js");

const clientID = "<CLIENT ID HERE> no its not the oauth";
var options = {
    options: {
        clientId: clientID,
        debug: false
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: "<YOUR BOT NAME>",
        password: "oauth:<ADD YOUR OWN OAUTH HERE>"
    },
    channels: ["#shroud"] // initial channel shouldn't matter, chose shroud since he was online most of the time during developement
};

var client = new tmi.client(options);
var dbFile = "./bans.json";
var dbData = {data: {}};
var recentBans = [];

function gotBanned(who, where) {
    if (recentBans.indexOf(`${who}${where}`) > -1)
        return;

    console.log(`${who} banned in ${where}`);
    getID(who);
    recentBans.push(`${who}${where}`);

    setTimeout(() => {
        let index = recentBans.indexOf(`${who}${where}`);
        if (index > -1)
            recentBans.splice(index, 1);
    }, 20 * 1000);
}

client.on("timeout", (channel, username, reason, duration) => {
    if (duration > 3601)
        gotBanned(username, channel);
});

client.on("ban", (channel, username, reason) => {
    gotBanned(username, channel);
});

function getStreams() {
    client.api({
        url: "https://api.twitch.tv/helix/streams?first=100",
        method: "GET",
        headers: {
            "Client-ID": clientID
        }
    }, (err, res, body) => {
        if (!err && body.data !== undefined) {
            options.channels = []
            for (let index = 0; index < body.data.length; index++) {
                const element = body.data[index]['thumbnail_url'].slice(52, -21);
                options.channels.push(`#${element}`);
                console.log(`Added channel: ${element}`);
            }
        }
    });
}

function getID(username) {
    client.api({
        url: "https://api.twitch.tv/helix/users?login=" + username,
        method: "GET",
        headers: {
            "Client-ID": clientID
        }
    }, (err, res, body) => {
        if (!err && body.data)
            getFollows(body.data[0].id);
    });
}

function getFollows(id) {
    client.api({
        url: "https://api.twitch.tv/helix/users/follows?first=100&from_id=" + id,
        method: "GET",
        headers: {
            "Client-ID": clientID
        }
    }, (err, res, body) => {
        if (!err) {
            for (let index = 0; index < body.total; index++) {
                const element = body.data[index];
                //console.log(`index ${index}: ${element.to_id}`);
                if (element)
                    if (!dbData.data[element.to_id])
                        dbData.data[element.to_id] = 1;
                    else
                        dbData.data[element.to_id]++;
            }
            dbWrite();
            return body;
        }
    });
}

// do the entire IF FILE DOESNT EXIST, CREATE, THEN START UPDATING

function dbCheck() {
    console.log(`CHECKING FOR DB...`);
    if (!fs.existsSync(dbFile)) {
        fs.appendFile(dbFile, JSON.stringify({ data: [] }), (err) => {
            if (err) throw err;
            console.log(`created new DB!`);
        });
    }
    else if (fs.existsSync(dbFile)) {
        dbData = JSON.parse(fs.readFileSync(dbFile));
        console.log(`found existing DB`);
    }
}

function dbWrite() {
    var _t = JSON.stringify(dbData);
    fs.writeFileSync(dbFile, _t);
}

setTimeout(() => { // top prio
    console.log(`[LEVEL 1] Executed`);
    dbCheck();
    setTimeout(() => { // mid prio
        console.log(`[LEVEL 2] Executed`);
        getStreams();
        setTimeout(() => { // low prio
            console.log(`[LEVEL 3] Executed`);
            client.connect();
        }, 500);
    }, 500);
}, 500);

setInterval(() => {
    console.log(`[LEVEL 1] Restarting...`);
    client.disconnect();
    getStreams();
    console.log(`Manual disconnect`);
    setTimeout(() => {
        client.connect();
        console.log(`Manual reconnect`);
        console.log(`[LEVEL 1] Restarted!`);
    }, 1000);
}, 30 * 60 * 1000);
