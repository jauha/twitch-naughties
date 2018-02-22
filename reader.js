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

var client = new tmi.client(options); // just creating this for the included request libs to reduce bloat
var db = fs.readFileSync("./bans.json");
var dbdata = JSON.parse(db);

var sortable = [];
var sorted = [];
for (var channel in dbdata.data) { // some object to array voodoo
    sortable.push([channel, dbdata.data[channel]]);
}

function getName(id) {
    client.api({
        url: "https://api.twitch.tv/helix/users?id=" + id,
        method: "GET",
        headers: {
            "Client-ID": clientID
        }
    }, (err, res, body) => {
        if (!err) // then again this could be a bit trecherous if 2nd request responds before first..?
            console.log(body.data[0].login);
    });
}

sortable.sort((a, b) => {
    return a[1] - b[1];
});
sortable.reverse();

for (let index = 0; index < sortable.length; index++) {
    var element = `${sortable[index]}`;
    sorted.push(element.substring(0, element.indexOf(",")));
}

for (let index = 0; index < 5; index++) {
    // Lists top 5
    getName(sorted[index]);
}
