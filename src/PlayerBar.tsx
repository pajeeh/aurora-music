import { useState } from 'react';
import {
  Heart,
  ListMusic,
  Monitor,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from './icons';
import { Cover } from './components';
import { formatTime } from './playback';
import type { Track } from './types';

export type RepeatMode = 'off' | 'all' | 'one';

export function PlayerBar({
  track,
  liked,
  like,
  playing,
  ready,
  canControl,
  previous,
  next,
  toggle,
  position,
  duration,
  seek,
  volume,
  setVolume,
  panel,
  setPanel,
  shuffle,
  setShuffle,
  repeat,
  setRepeat,
  grouped,
}: {
  track: Track;
  liked: boolean;
  like: () => void;
  playing: boolean;
  ready: boolean;
  canControl: boolean;
  previous?: () => void;
  next?: () => void;
  toggle: () => void;
  position: number;
  duration: number;
  seek: (value: number) => void;
  volume: number;
  setVolume: (value: number) => void;
  panel: 'queue' | 'devices' | 'lyrics';
  setPanel: (value: 'queue' | 'devices' | 'lyrics') => void;
  shuffle: boolean;
  setShuffle: (value: boolean) => void;
  repeat: RepeatMode;
  setRepeat: (value: RepeatMode) => void;
  grouped: boolean;
}) {
  const [lastVolume, setLastVolume] = useState(70);
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <footer className="playerbar compact-player">
      <div className="track-mini">
        <Cover artwork={track.artwork} />
        <span>
          <b>{track.title}</b>
          <small>{track.artist}</small>
        </span>
        <button
          aria-label={liked ? 'Descurtir música no player' : 'Curtir música no player'}
          aria-pressed={liked}
          onClick={like}
        >
          <Heart fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="controls">
        <div>
          <button
            aria-label="Ordem aleatória"
            aria-pressed={shuffle}
            disabled={!canControl || grouped}
            title={grouped ? 'Disponível na fila individual' : 'Ordem aleatória'}
            onClick={() => setShuffle(!shuffle)}
          >
            <Shuffle />
          </button>
          <button
            aria-label="Faixa anterior"
            disabled={!canControl || !previous}
            onClick={previous}
          >
            <SkipBack fill="currentColor" />
          </button>
          <button
            className="play-button"
            aria-label={playing ? 'Pausar' : 'Reproduzir'}
            disabled={!canControl || !ready}
            onClick={toggle}
          >
            {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
          <button
            aria-label="Próxima faixa"
            disabled={!canControl || !next}
            onClick={next}
          >
            <SkipForward fill="currentColor" />
          </button>
          <button
            aria-label={`Repetição: ${
              repeat === 'off' ? 'desativada' : repeat === 'all' ? 'fila' : 'uma faixa'
            }`}
            aria-pressed={repeat !== 'off'}
            disabled={!canControl || grouped}
            title={grouped ? 'Disponível na fila individual' : 'Alternar repetição'}
            onClick={() =>
              setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')
            }
          >
            <RepeatIcon />
          </button>
        </div>

        <div className="timeline">
          <span>{formatTime(position)}</span>
          <input
            aria-label="Posição da reprodução"
            type="range"
            min={0}
            max={duration || 1}
            value={Math.min(position, duration || 1)}
            disabled={!canControl || !duration}
            onChange={event => seek(Number(event.target.value))}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="volume">
        <button
          aria-label="Mostrar fila"
          aria-pressed={panel === 'queue'}
          onClick={() => setPanel('queue')}
        >
          <ListMusic />
        </button>
        <button
          aria-label="Mostrar dispositivos"
          aria-pressed={panel === 'devices'}
          onClick={() => setPanel('devices')}
        >
          <Monitor />
        </button>
        <button
          className="mute-toggle"
          aria-label={volume === 0 ? 'Restaurar volume' : 'Silenciar'}
          aria-pressed={volume === 0}
          onClick={() => {
            if (volume > 0) {
              setLastVolume(volume);
              setVolume(0);
            } else {
              setVolume(lastVolume);
            }
          }}
        >
          {volume === 0 ? <VolumeX /> : <Volume2 />}
        </button>
        <input
          aria-label="Volume deste dispositivo"
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={event => setVolume(Number(event.target.value))}
        />
      </div>
    </footer>
  );
}
