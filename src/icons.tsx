import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import * as Glyphs from 'lucide-react';

// One vector grid, stroke weight and accessible decorative treatment for all controls.
function aurora(Icon: LucideIcon): LucideIcon {
  return forwardRef((props, ref) => (
    <Icon
      {...props}
      ref={ref}
      strokeWidth={1.8}
      className={`aurora-glyph ${props.className ?? ''}`}
      aria-hidden="true"
      focusable="false"
    />
  ));
}

export const Play = aurora(Glyphs.Play);
export const Pause = aurora(Glyphs.Pause);
export const Stop = aurora(Glyphs.Square);
export const SkipForward = aurora(Glyphs.SkipForward);
export const SkipBack = aurora(Glyphs.SkipBack);
export const Shuffle = aurora(Glyphs.Shuffle);
export const Repeat = aurora(Glyphs.Repeat);
export const Repeat1 = aurora(Glyphs.Repeat1);
export const Heart = aurora(Glyphs.Heart);
export const ListMusic = aurora(Glyphs.ListMusic);
export const Home = aurora(Glyphs.House);
export const Library = aurora(Glyphs.Library);
export const Search = aurora(Glyphs.Search);
export const Discover = aurora(Glyphs.Compass);
export const Radio = aurora(Glyphs.Radio);
export const Visualizer = aurora(Glyphs.AudioLines);
export const Equalizer = aurora(Glyphs.SlidersVertical);
export const Moon = aurora(Glyphs.Moon);
export const Sun = aurora(Glyphs.Sun);
export const Settings = aurora(Glyphs.Settings);
export const Profile = aurora(Glyphs.UserRound);
export const Download = aurora(Glyphs.Download);
export const Upload = aurora(Glyphs.Upload);
export const Folder = aurora(Glyphs.Folder);
export const Monitor = aurora(Glyphs.Monitor);
export const Volume2 = aurora(Glyphs.Volume2);
export const VolumeX = aurora(Glyphs.VolumeX);
export const NowPlaying = aurora(Glyphs.AudioLines);
export const ArrowLeft = aurora(Glyphs.ArrowLeft);
export const ChevronDown = aurora(Glyphs.ChevronDown);
export const ChevronUp = aurora(Glyphs.ChevronUp);
export const Plus = aurora(Glyphs.Plus);
export const X = aurora(Glyphs.X);
export const MoreHorizontal = aurora(Glyphs.MoreHorizontal);
export const Clock3 = aurora(Glyphs.Clock3);
export const LogIn = aurora(Glyphs.LogIn);
export const Users = aurora(Glyphs.Users);
export const CirclePlay = aurora(Glyphs.CirclePlay);
export const RefreshCw = aurora(Glyphs.RefreshCw);
