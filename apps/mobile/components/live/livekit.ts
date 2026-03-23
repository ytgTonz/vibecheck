let LiveKitRoom: any;
let VideoTrack: any;
let useRemoteParticipants: any;
let useTracks: any;
let useChat: any;
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
  isTrackReference = lkComponents.isTrackReference;
  AudioSession = lkComponents.AudioSession;
  AndroidAudioTypePresets = lkComponents.AndroidAudioTypePresets;

  const lkClient = require('livekit-client');
  TrackSource = lkClient.Track?.Source;
} catch {
  // LiveKit native modules may not be available in Expo Go.
}

export {
  AndroidAudioTypePresets,
  AudioSession,
  isTrackReference,
  LiveKitRoom,
  TrackSource,
  useChat,
  useRemoteParticipants,
  useTracks,
  VideoTrack,
};
