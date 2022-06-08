const Alexa = require('ask-sdk-core');

import * as generalHandlers from './handlers/general';
import * as movieHandlers from './handlers/movies';
import * as showHandlers from './handlers/shows';


const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    return generalHandlers.handleLaunchIntent(handlerInput);
  }
};

//app.launch(generalHandlers.handleLaunchIntent);

const FindMovieRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FindMovie';
  },
  handle(handlerInput) {
    console.log("FindMovie");
    return movieHandlers.handleFindMovieIntent(handlerInput);
  }
};

// app.intent('FindMovie', movieHandlers.handleFindMovieIntent);
// app.intent('AddMovie', movieHandlers.handleAddMovieIntent);

// app.intent('FindShow', showHandlers.handleFindShowIntent);
// app.intent('AddShow', showHandlers.handleAddShowIntent);

// app.intent('AMAZON.YesIntent', generalHandlers.handleYesIntent);
const YesIntentRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'YesIntent';
  },
  handle(handlerInput) {
    console.log("YesIntent");
    return generalHandlers.handleYesIntent(handlerInput);
  }
};
// app.intent('AMAZON.NoIntent', generalHandlers.handleNoIntent);
// app.intent('AMAZON.CancelIntent', generalHandlers.handleCancelIntent);
// app.intent('AMAZON.HelpIntent', generalHandlers.handleHelpIntent);

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {

    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I don\'t understand your command. Please say it again.')
      .withShouldEndSession(true)
      .getResponse();
  }
};

// app.post = function (request, response, type, exception) {
//   if (exception) {
//     // Always turn an exception into a successful response
//     response.clear().say('An error occured: ' + exception).send();
//   }
// };

// export default app.lambda();
export default Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    FindMovieRequestHandler,
    YesIntentRequestHandler)
  .addErrorHandlers(ErrorHandler)
  .lambda();

