import { Audio } from 'expo-av';

type SoundKey = 'petalPick' | 'dockPlace' | 'bloom' | 'fail' | 'match' | 'levelComplete';

const soundMap: Record<SoundKey, number | null> = {
  petalPick: null,
  dockPlace: null,
  bloom: null,
  fail: null,
  match: null,
  levelComplete: null,
};

let isEnabled = true;
const loadedSounds: Partial<Record<SoundKey, Audio.Sound>> = {};

async function loadSound(key: SoundKey, source: number): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: false,
      isLooping: false,
    });
    loadedSounds[key] = sound;
  } catch {
    // Sound file missing or unsupported — silent fail
  }
}

export async function preloadSounds(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch {
    // ignore
  }

  // Sound files not yet present — no-op loads
  for (const key of Object.keys(soundMap) as SoundKey[]) {
    const src = soundMap[key];
    if (src !== null) {
      await loadSound(key, src);
    }
  }
}

async function play(key: SoundKey): Promise<void> {
  if (!isEnabled) return;
  const sound = loadedSounds[key];
  if (!sound) return;
  try {
    await sound.replayAsync();
  } catch {
    // ignore playback errors
  }
}

export async function unloadSounds(): Promise<void> {
  for (const sound of Object.values(loadedSounds)) {
    try {
      await sound?.unloadAsync();
    } catch {
      // ignore
    }
  }
}

export function setSoundEnabled(enabled: boolean): void {
  isEnabled = enabled;
}

export const AudioService = {
  playPetalPick: () => play('petalPick'),
  playDockPlace: () => play('dockPlace'),
  playBloom: () => play('bloom'),
  playFail: () => play('fail'),
  playMatch: () => play('match'),
  playLevelComplete: () => play('levelComplete'),
  preload: preloadSounds,
  unload: unloadSounds,
  setEnabled: setSoundEnabled,
};

export default AudioService;
