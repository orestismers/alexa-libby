import SSML from 'alexa-app/lib/to-ssml';

export default function getResponseSSML(response) {
  return SSML.cleanse(response.response.response.outputSpeech.ssml);
}
