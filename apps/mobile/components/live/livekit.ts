let LiveKitRoom: any;
let VideoTrack: any;
let useRemoteParticipants: any;
let useTracks: any;
let useChat: any;
let useLocalParticipant: any;
let isTrackReference: any;
let TrackSource: any;
let AudioSession: any;
let AndroidAudioTypePresets: any;

try {
  const lkComponents = require('@livekit/react-native');
  LiveKitRoom = lkComponents.LiveKitRoom;
  VideoTrack = lkComponents.VideoTrack;
  useRemoteParticipants = lkComponents.useRemoteParticipants;
  useTracks = lkComponents.useTracks;
  useChat = lkComponents.useChat;
  useLocalParticipant = lkComponents.useLocalParticipant;
  isTrackReference = lkComponents.isTrackReference;
  AudioSession = lkComponents.AudioSession;
  AndroidAudioTypePresets = lkComponents.AndroidAudioTypePresets;

  const lkClient = require('livekit-client');
  TrackSource = lkClient.Track?.Source;
} catch (err: any) {
  // Only swallow module-not-found errors (Expo Go). Re-throw real bugs.
  if (err?.code !== 'MODULE_NOT_FOUND' && !err?.message?.includes('Cannot find module')) {
    throw err;
  }
  if (__DEV__) console.log('[LiveKit] Native modules not available — running in limited mode.');
}

export {
  AndroidAudioTypePresets,
  AudioSession,
  isTrackReference,
  LiveKitRoom,
  TrackSource,
  useChat,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  VideoTrack,
};
