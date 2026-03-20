import { AccessToken, RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';

const LIVEKIT_API_URL = process.env.LIVEKIT_API_URL || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

/** Create a LiveKit JWT token for room access. */
export async function createToken(
  identity: string,
  roomName: string,
  options: { canPublish: boolean; name?: string },
): Promise<string> {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: options.name,
    ttl: '6h',
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: options.canPublish,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
}

/** RoomServiceClient for server-side room management. */
export const roomService = new RoomServiceClient(
  LIVEKIT_API_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
);

/** WebhookReceiver for verifying incoming LiveKit webhooks. */
export const webhookReceiver = new WebhookReceiver(
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
);
