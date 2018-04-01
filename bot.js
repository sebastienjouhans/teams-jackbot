require('dotenv').config();

var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret
};

var Botkit = require('botkit');

var controller = Botkit.teamsbot(bot_options);

var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflowDeveloperToken,
});

controller.middleware.receive.use(dialogflowMiddleware.receive);

// controller.setupWebserver(process.env.PORT,function(err,webserver) {
//   controller.createWebhookEndpoints(controller.webserver, bot, function() {
//       console.log('This bot is online!!!');
//   });
// });

var webserver = require(__dirname + '/components/express_webserver.js')(controller);

controller.startTicking();

var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller, dialogflowMiddleware);
});


controller.hears(['hello'], 'message_received', function(bot, message) {

    bot.reply(message, 'Hey there.');

});

controller.hears(['cookies'], 'message_received', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.say('Did someone say cookies!?!!');
        convo.ask('What is your favorite type of cookie?', function(response, convo) {
            convo.say('Golly, I love ' + response.text + ' too!!!');
            convo.next();
        });
    });
});