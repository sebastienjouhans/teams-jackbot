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

if (process.env.mongoUri) {
    var mongoStorage = require('botkit-storage-mongo')({mongoUri: process.env.mongoUri});
    bot_options.storage = mongoStorage;
} else {
    debug("No mongodb storage Uri");
}

mongoClient.connect(process.env.mongoUri, function (err, client) {
    var db = client.db('jackbot');

    //console.log(db.content.find().pretty());    

    db.collection('content', function (err, collection) {
        if (err) throw err;
        content = collection;       
        console.log(content.find().pretty());        
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

// controller.hears(['templates_intent'], 'direct_message,direct_mention,mention', dialogflowMiddleware.hears, function(bot, message) {

//     if(message.entities){
//         switch(message.entities.template_name_entity.toLocaleLowerCase())
//         {
//             case 'creative': 
//                 bot.reply(message, "path to creative brief template"); 
//                 break;
//             case 'pitch': 
//                 bot.reply(message, "path to pitch template");
//                 break;
//             case 'presentation': 
//                 bot.reply(message, "path to presentation template");
//                 break;
//             case 'creds': 
//                 bot.reply(message, "path to creds template");
//                 break;
//         }
//     }
// });

// controller.hears('who am i', 'direct_message, direct_mention', function(bot, message) {
//     bot.api.getUserById(message.channel, message.user, function(err, user) {
//         if (err) {
//           bot.reply(message,'Error loading user:' + err);
//         } else {
//           bot.reply(message,'You are ' + user.name + ' and your email is ' + user.email + ' and your user id is ' + user.id);
//         }
//     });
// });

controller.on('direct_mention', function(bot, message) {
    bot.reply(message, 'You mentioned me and said, "' + message.text + '"');
});

controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
});