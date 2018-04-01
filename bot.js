require('dotenv').config();

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');
var mongoClient = require('mongodb').MongoClient;

var bot_options = {
    debug: true,
    log: true,
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
};

var content = {};

// if (process.env.mongoUri) {
//     var mongoStorage = require('botkit-storage-mongo')({mongoUri: process.env.mongoHistoryUri});
//     bot_options.storage = mongoStorage;
// } else {
//     debug("No mongodb storage Uri");
// }

mongoClient.connect(process.env.mongoUri, function (err, client) {
    var db = client.db('jackbot'); 

    db.collection('content', function (err, collection) {
        if (err) throw err;

        content = collection.find({});       
        content.each(function(err, doc) {
            if(err)
                throw err;
            if(doc==null)
                return;
         
            console.log("document find:");
            console.log(doc.person);
            console.log(doc.person[1].name);
        });
    });
  db.close();
});

var controller = Botkit.teamsbot(bot_options);

var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflowDeveloperToken,
});

controller.middleware.receive.use(dialogflowMiddleware.receive);

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, function() {
        console.log("BOTKIT: Webhooks set up!");
    });
});

var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller, dialogflowMiddleware);
});


controller.hears('hello', 'direct_message,direct_mention', function(bot, message) {
    bot.reply(message, 'Hi');
});

controller.on('direct_mention', function(bot, message) {
    bot.reply(message, 'You mentioned me and said, "' + message.text + '"');
});

controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
});