import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as ort from 'onnxruntime-web';
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

export const FACE_MODEL = {
  nome: 'opencv_sface',
  versao: '2021dec-int8bq',
  dimensao: 128,
  inputSize: 112,
  checksum: 'sha256:fb143eea07838aa532d1c95df5f69899974ea0140e1fba05e94204be13ed74ee',
  path: '/models/sface/face_recognition_sface_2021dec_int8bq.onnx',
};

let landmarkerPromise: Promise<FaceLandmarker> | null = null;
let sessionPromise: Promise<ort.InferenceSession> | null = null;

export async function runFaceLogin(dispositivoId: string) {
  const stream = await openCamera();
  try {
    const challenge = await authApi.operatorFaceChallenge({ dispositivoId });
    const capture = await captureEmbedding(stream, challenge.sequence);
    return await authApi.operatorFaceLogin({
      challengeId: challenge.challengeId,
      dispositivoId,
      embedding: capture.embedding,
      qualidade: capture.qualidade,
      liveness: { valid: true, steps: challenge.sequence, frames: capture.frames, faces: 1 },
      model: { nome: FACE_MODEL.nome, versao: FACE_MODEL.versao, dimensao: FACE_MODEL.dimensao },
    });
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export async function captureEmbedding(stream: MediaStream, sequence: string[]) {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  await video.play();
  await waitForVideo(video);

  const landmarker = await getLandmarker();
  const embeddings: number[][] = [];
  let qualityTotal = 0;
  let frames = 0;

  for (let i = 0; i < Math.max(5, sequence.length + 3); i += 1) {
    await delay(120);
    const result = landmarker.detectForVideo(video, performance.now());
    if (result.faceLandmarks.length !== 1)
      throw new Error(result.faceLandmarks.length > 1 ? 'mais_de_um_rosto' : 'centralize_o_rosto');
    const quality = estimateQuality(video, result.faceLandmarks[0]);
    if (quality < 0.6) throw new Error('melhore_a_iluminacao');
    const tensor = cropNormalize(video, result.faceLandmarks[0]);
    embeddings.push(await inferEmbedding(tensor));
    qualityTotal += quality;
    frames += 1;
    tensor.dispose();
  }

  video.srcObject = null;
  return { embedding: normalize(mean(embeddings)), qualidade: qualityTotal / frames, frames };
}

async function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('camera_indisponivel');
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
}

async function getLandmarker() {
  landmarkerPromise ??= FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm',
  ).then((vision) =>
    FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 2,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    }),
  );
  return landmarkerPromise;
}

async function getSession() {
  sessionPromise ??= ort.InferenceSession.create(FACE_MODEL.path, { executionProviders: ['wasm'] });
  return sessionPromise;
}

async function inferEmbedding(input: ort.Tensor): Promise<number[]> {
  const session = await getSession();
  const feeds: Record<string, ort.Tensor> = { [session.inputNames[0]]: input };
  const output = await session.run(feeds);
  const values = Array.from(output[session.outputNames[0]].data as Float32Array);
  Object.values(output).forEach((tensor) => tensor.dispose?.());
  return normalize(values);
}

function cropNormalize(video: HTMLVideoElement, landmarks: NormalizedLandmark[]): ort.Tensor {
  const canvas = document.createElement('canvas');
  canvas.width = FACE_MODEL.inputSize;
  canvas.height = FACE_MODEL.inputSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas_indisponivel');
  const box = boundingBox(landmarks, video.videoWidth, video.videoHeight);
  ctx.drawImage(video, box.x, box.y, box.w, box.h, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const chw = new Float32Array(1 * 3 * canvas.width * canvas.height);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    chw[p] = (pixels[i + 2] - 127.5) / 128;
    chw[p + canvas.width * canvas.height] = (pixels[i + 1] - 127.5) / 128;
    chw[p + 2 * canvas.width * canvas.height] = (pixels[i] - 127.5) / 128;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return new ort.Tensor('float32', chw, [1, 3, canvas.height, canvas.width]);
}

function estimateQuality(video: HTMLVideoElement, landmarks: NormalizedLandmark[]): number {
  const box = boundingBox(landmarks, video.videoWidth, video.videoHeight);
  const faceRatio = Math.min(box.w / video.videoWidth, box.h / video.videoHeight);
  return Math.max(0, Math.min(1, faceRatio * 4));
}

function boundingBox(landmarks: NormalizedLandmark[], width: number, height: number) {
  const xs = landmarks.map((point) => point.x * width);
  const ys = landmarks.map((point) => point.y * height);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const side = Math.max(maxX - minX, maxY - minY) * 1.35;
  return {
    x: Math.max(0, minX + (maxX - minX - side) / 2),
    y: Math.max(0, minY + (maxY - minY - side) / 2),
    w: Math.min(width, side),
    h: Math.min(height, side),
  };
}

function mean(samples: number[][]): number[] {
  return samples[0].map(
    (_, index) => samples.reduce((sum, sample) => sum + sample[index], 0) / samples.length,
  );
}

function normalize(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return magnitude ? values.map((value) => value / magnitude) : values;
}

function waitForVideo(video: HTMLVideoElement) {
  if (video.videoWidth) return Promise.resolve();
  return new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function syntheticEmbedding(seed: string, challengeId: string): number[] {
  const input = `${seed}:${challengeId}:concretrack-face-test`;
  return normalize(
    Array.from({ length: FACE_MODEL.dimensao }, (_, index) =>
      Math.sin(input.charCodeAt(index % input.length) + index * 17),
    ),
  );
}

interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}
