/**
 * Anime Roulette Sound Effects Utility
 * Uses free sounds from Pixabay/standard CDNs.
 */

const SOUND_URLS = {
  match: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3', // Sword/Shing
  message: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Pop
  alert: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Chime
  overtime: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3', // Ticking
};


class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private muted: boolean = false;

  constructor() {
    // Preload sounds
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.5;
      this.sounds.set(key, audio);
    });

    // Check localStorage for mute preference
    this.muted = localStorage.getItem('anime_muted') === 'true';
  }

  play(name: keyof typeof SOUND_URLS) {
    if (this.muted) return;
    const sound = this.sounds.get(name);
    if (sound) {
      sound.currentTime = 0;
      const promise = sound.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Browser blocked autoplay
          console.log('Sound blocked by browser policy. Click anywhere to enable.');
        });
      }
    }
  }


  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('anime_muted', String(this.muted));
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

export const soundManager = new SoundManager();
