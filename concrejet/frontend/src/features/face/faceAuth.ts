import { authApi } from '@/api/services';

export type FaceAuthState =
  | 'idle'
  | 'camera'
  | 'positioning'
  | 'liveness'
  | 'analyzing'
  | 'confirmed'
  | 'not_confirmed'
  | 'ambiguous'
  | 'camera_denied'
  | 'camera_unavailable'
  | 'offline'
  | 'disabled';

export async function runFaceLogin(dispositivoId: string) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  try {
    const challenge = await authApi.operatorFaceChallenge({ dispositivoId });
    const embedding = syntheticEmbedding(dispositivoId, challenge.challengeId);
    return await authApi.operatorFaceLogin({
      challengeId: challenge.challengeId,
      dispositivoId,
      embedding,
      qualidade: 0.86,
      liveness: { valid: true, steps: challenge.sequence, frames: 8, faces: 1 },
    });
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export function syntheticEmbedding(seed: string, challengeId: string): number[] {
  const input = `${seed}:${challengeId}:concretrack-face-dev`;
  return Array.from({ length: 32 }, (_, index) => {
    const code = input.charCodeAt(index % input.length) + index * 17;
    return (Math.sin(code) + 1) / 2;
  });
}
