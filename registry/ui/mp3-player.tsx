"use client";

import * as React from "react";
import { Slider } from "@base-ui/react/slider";

import { cn } from "@/registry/lib/utils";
import { useIcon } from "@/registry/lib/icon-context";
import { Button } from "@/registry/ui/button";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const hrs = Math.floor(whole / 3600);
  const mins = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/* Split in two so the 60fps time updates (TimeContext) only re-render the
 * parts that display time, not the whole tree — everything else (duration,
 * paused, the actions) changes rarely and lives in PlayerContext.
 */

interface PlayerContextValue {
  src: string;
  title?: string;
  artist?: string;
  artwork?: string;
  peaks?: number[];
  duration: number;
  paused: boolean;
  waiting: boolean;
  error: boolean;
  playbackRate: number;
  toggle: () => void;
  seek: (seconds: number) => void;
  setRate: (rate: number) => void;
  setScrubTime: (t: number | null) => void;
}

const PlayerContext = React.createContext<PlayerContextValue | null>(null);

function usePlayer() {
  const context = React.useContext(PlayerContext);
  if (!context) {
    throw new Error("MP3Player parts must be used within <MP3Player>");
  }
  return context;
}

interface TimeContextValue {
  currentTime: number;
  scrubTime: number | null;
}

const TimeContext = React.createContext<TimeContextValue | null>(null);

function useTime() {
  const context = React.useContext(TimeContext);
  if (!context) {
    throw new Error("MP3Player parts must be used within <MP3Player>");
  }
  return context;
}

interface MP3PlayerProps extends Omit<React.ComponentProps<"div">, "title"> {
  src: string;
  /** Shown on the lock screen and in the OS media controls. */
  title?: string;
  artist?: string;
  artwork?: string;
  peaks?: number[];
  autoPlay?: boolean;
  loop?: boolean;
}

// One playing element at a time across every mounted player, so a page of
// demos never plays over itself.
let current: HTMLAudioElement | null = null;

function MP3Player({
  src,
  title,
  artist,
  artwork,
  peaks,
  autoPlay,
  loop,
  className,
  children,
  onKeyDown,
  ...props
}: MP3PlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = React.useState(0);
  const [paused, setPaused] = React.useState(true);
  const [waiting, setWaiting] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [scrubTime, setScrubTime] = React.useState<number | null>(null);

  const hasMediaSession =
    title !== undefined && typeof navigator !== "undefined" && "mediaSession" in navigator;

  // Reads live values off the element rather than React state, so it can be
  // called from the same event that just changed them (loadedmetadata, a
  // seek) without racing a state update that hasn't landed yet.
  const updatePositionState = React.useCallback(() => {
    if (!hasMediaSession) return;
    const audio = audioRef.current;
    const mediaDuration = audio?.duration;
    if (!audio || !Number.isFinite(mediaDuration) || !mediaDuration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: mediaDuration,
        playbackRate: audio.playbackRate,
        position: Math.min(audio.currentTime, mediaDuration),
      });
    } catch {
      // Throws if position > duration — can happen for a stale call.
    }
  }, [hasMediaSession]);

  const seek = React.useCallback(
    (t: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      // The element's own duration, not state: the Media Session handlers hold
      // this function from the moment playback started, possibly before
      // metadata had landed.
      const end = Number.isFinite(audio.duration) ? audio.duration : t;
      const clamped = Math.min(Math.max(t, 0), end);
      audio.currentTime = clamped;
      // Set state immediately too — otherwise the thumb snaps back to the old
      // position until the `seeked` event arrives.
      setCurrentTime(clamped);
      updatePositionState();
    },
    [updatePositionState]
  );

  const toggle = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const setRate = React.useCallback((rate: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
  }, []);

  // The `timeupdate` event only fires ~4x/s, which makes the bar step —
  // this keeps it gliding while playing.
  React.useEffect(() => {
    if (paused) return;
    let frame: number;
    const tick = () => {
      const audio = audioRef.current;
      if (audio) setCurrentTime(audio.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  React.useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio && current === audio) {
        current = null;
        if (hasMediaSession) {
          navigator.mediaSession.metadata = null;
          navigator.mediaSession.setActionHandler("play", null);
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.setActionHandler("seekto", null);
          navigator.mediaSession.setActionHandler("seekbackward", null);
          navigator.mediaSession.setActionHandler("seekforward", null);
        }
      }
    };
  }, [hasMediaSession]);

  const handleDuration = () => {
    const d = audioRef.current?.duration ?? NaN;
    setDuration(Number.isFinite(d) ? d : 0);
  };

  const handlePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      if (current && current !== audio) current.pause();
      current = audio;
    }
    setPaused(false);
    if (hasMediaSession && audio) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title ?? "",
        artist: artist ?? "",
        artwork: artwork ? [{ src: artwork }] : [],
      });
      navigator.mediaSession.setActionHandler("play", () => audio.play().catch(() => {}));
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null) seek(details.seekTime);
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        seek(audio.currentTime - (details.seekOffset ?? 10));
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        seek(audio.currentTime + (details.seekOffset ?? 10));
      });
    }
    updatePositionState();
  };

  const handleRateChange = () => {
    const audio = audioRef.current;
    if (audio) setPlaybackRate(audio.playbackRate);
    updatePositionState();
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) setCurrentTime(audio.currentTime);
  };

  const playerContextValue = React.useMemo<PlayerContextValue>(
    () => ({
      src,
      title,
      artist,
      artwork,
      peaks,
      duration,
      paused,
      waiting,
      error,
      playbackRate,
      toggle,
      seek,
      setRate,
      setScrubTime,
    }),
    [src, title, artist, artwork, peaks, duration, paused, waiting, error, playbackRate, toggle, seek, setRate]
  );

  const timeContextValue = React.useMemo<TimeContextValue>(
    () => ({ currentTime, scrubTime }),
    [currentTime, scrubTime]
  );

  return (
    <PlayerContext.Provider value={playerContextValue}>
      <TimeContext.Provider value={timeContextValue}>
        <div
          data-slot="mp3-player"
          className={cn(
            "flex w-full items-center gap-2.5 border border-border bg-card p-2.5",
            "rounded-[var(--radius-container,calc(var(--radius,0.5rem)_+_4px))]",
            className
          )}
          onKeyDown={(event) => {
            // Buttons/links already activate on Space; the slider thumb's
            // input does not, so this makes Space play/pause while scrubbing
            // with arrow keys.
            if (event.key === " " && !(event.target as HTMLElement).closest("button, a")) {
              event.preventDefault();
              toggle();
            }
            onKeyDown?.(event);
          }}
          {...props}
        >
          {children ?? (
            <>
              <MP3PlayerPlay />
              <MP3PlayerTime />
              <MP3PlayerScrubber className="flex-1" />
              <MP3PlayerTime remaining />
              <MP3PlayerSpeed />
              <MP3PlayerDownload />
            </>
          )}
          <audio
            ref={audioRef}
            src={src}
            autoPlay={autoPlay}
            loop={loop}
            preload="metadata"
            hidden
            onLoadedMetadata={() => {
              handleDuration();
              updatePositionState();
            }}
            onDurationChange={handleDuration}
            onPlay={handlePlay}
            onPause={() => setPaused(true)}
            onEnded={() => setPaused(true)}
            onWaiting={() => setWaiting(true)}
            onPlaying={() => setWaiting(false)}
            onCanPlay={() => setWaiting(false)}
            onRateChange={handleRateChange}
            onLoadStart={() => setError(false)}
            onError={() => setError(true)}
            onTimeUpdate={handleTimeUpdate}
            onSeeked={handleTimeUpdate}
          />
        </div>
      </TimeContext.Provider>
    </PlayerContext.Provider>
  );
}

function MP3PlayerPlay({ className }: { className?: string }) {
  const { paused, waiting, error, toggle } = usePlayer();
  const PlayIcon = useIcon("play");
  const PauseIcon = useIcon("pause");
  const LoaderIcon = useIcon("loader");
  const showLoader = waiting && !paused;

  const iconClass =
    "absolute inset-0 flex items-center justify-center opacity-0 scale-25 blur-[4px] transition-[opacity,scale,filter] duration-(--motion-moderate) ease-spring data-[shown=true]:opacity-100 data-[shown=true]:scale-100 data-[shown=true]:blur-none";

  return (
    <Button
      type="button"
      variant="primary"
      size="icon"
      className={cn("rounded-full", className)}
      onClick={toggle}
      disabled={error}
      aria-label={error ? "Audio unavailable" : paused ? "Play" : "Pause"}
    >
      <span className="relative block size-4">
        <span data-shown={paused && !showLoader} className={iconClass}>
          {/* A triangle's mass sits left of its bounding box; nudge it right
              to read as centred (same fix the Svelte version used). */}
          <PlayIcon size={16} className="size-4 fill-current translate-x-px" />
        </span>
        <span data-shown={!paused && !showLoader} className={iconClass}>
          <PauseIcon size={16} className="size-4 fill-current" />
        </span>
        <span data-shown={showLoader} className={iconClass}>
          <LoaderIcon size={16} className="size-4 animate-spin" />
        </span>
      </span>
    </Button>
  );
}

interface MP3PlayerTimeProps extends React.ComponentProps<"span"> {
  remaining?: boolean;
  format?: (seconds: number) => string;
}

function MP3PlayerTime({ remaining, format = formatTime, className, ...props }: MP3PlayerTimeProps) {
  const { duration } = usePlayer();
  const { currentTime, scrubTime } = useTime();
  const t = scrubTime ?? currentTime;
  const display = remaining ? `-${format(Math.max(0, duration - t))}` : format(t);

  return (
    <span className={cn("text-xs tabular-nums text-muted-foreground shrink-0", className)} {...props}>
      {display}
    </span>
  );
}

interface MP3PlayerScrubberProps extends Omit<React.ComponentProps<"div">, "defaultValue"> {
  peaks?: number[];
}

// Merges neighbouring peaks (keeping the loudest) down to `count` bars. Never
// upsamples: fewer peaks than bars just renders wider bars.
function resamplePeaks(peaks: number[], count: number): number[] {
  if (count <= 0 || count >= peaks.length) return peaks;
  return Array.from({ length: count }, (_, i) => {
    const start = Math.floor((i * peaks.length) / count);
    const end = Math.max(Math.floor(((i + 1) * peaks.length) / count), start + 1);
    return Math.max(...peaks.slice(start, end));
  });
}

// A bar plus its gap. Below ~3px per bar the waveform turns into hairlines.
const BAR_PITCH = 3;

// Fits the bar count to the track's width, so a narrow player merges peaks
// instead of drawing sub-pixel bars.
function useFittedPeaks(peaks: number[] | undefined) {
  const [track, setTrack] = React.useState<HTMLDivElement | null>(null);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!track) return;
    // Measured once up front: the observer's first callback waits for a
    // rendering step, which would paint every peak as a hairline first.
    setCount(Math.floor(track.clientWidth / BAR_PITCH));
    const observer = new ResizeObserver(([entry]) => {
      setCount(Math.floor(entry.contentRect.width / BAR_PITCH));
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, [track]);

  const fitted = React.useMemo(
    () => (peaks ? resamplePeaks(peaks, count) : undefined),
    [peaks, count]
  );
  return [fitted, setTrack] as const;
}

// Isolated so the 60fps time updates only re-render the clip-path variable
// above it, not one span per peak.
const Bars = React.memo(function Bars({
  peaks,
  barClassName,
}: {
  peaks: number[];
  barClassName: string;
}) {
  return (
    <div className="flex h-full items-center gap-px">
      {peaks.map((p, i) => (
        <span
          key={i}
          className={cn("flex-1 rounded-full", barClassName)}
          // A silent stretch still shows as a dot rather than disappearing.
          style={{ height: `${Math.max(p, 0.04) * 100}%` }}
        />
      ))}
    </div>
  );
});

function MP3PlayerScrubber({ peaks: peaksProp, className, ...props }: MP3PlayerScrubberProps) {
  const { duration, error, peaks: contextPeaks, seek, setScrubTime } = usePlayer();
  const { currentTime, scrubTime } = useTime();
  const [peaks, trackRef] = useFittedPeaks(peaksProp ?? contextPeaks);
  const value = scrubTime ?? currentTime;
  // Falls back to 1 so a zero-length range doesn't park the thumb mid-track
  // before metadata has loaded.
  const max = duration || 1;
  const played = (value / max) * 100;

  const handleThumbKeyDown = (event: React.KeyboardEvent) => {
    let delta = 0;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        delta = -5;
        break;
      case "ArrowRight":
      case "ArrowUp":
        delta = 5;
        break;
      case "PageDown":
        delta = -15;
        break;
      case "PageUp":
        delta = 15;
        break;
      default:
        return;
    }
    // The slider's own step (0.01, for smooth dragging on short clips) would
    // otherwise tie arrow-key stepping to that same tiny amount. Base UI's own
    // handler bails out as soon as `defaultPrevented` is set, so this alone
    // stops it from also running (Slider.Thumb's `onKeyDown` type doesn't
    // expose the `preventBaseUIHandler` escape hatch the way a `render` prop
    // handler would).
    event.preventDefault();
    seek(value + delta);
  };

  return (
    <Slider.Root
      value={value}
      min={0}
      max={max}
      step={0.01}
      disabled={!duration || error}
      onValueChange={(v) => setScrubTime(v)}
      onValueCommitted={(v) => {
        seek(v);
        setScrubTime(null);
      }}
      className={cn("min-w-0", className)}
      {...props}
    >
      <Slider.Control className="group/scrubber relative flex h-10 w-full items-center cursor-pointer touch-none select-none">
        {peaks && peaks.length > 0 ? (
          <Slider.Track
            ref={trackRef}
            className="relative h-8 w-full bg-transparent"
            style={{ "--played": `${played}%` } as React.CSSProperties}
          >
            <div className="absolute inset-0">
              <Bars peaks={peaks} barClassName="bg-foreground/20" />
            </div>
            {/* Two clipped copies of the same bars rather than a canvas: colour
                follows tokens and dark mode for free, and only the clip
                percentage needs to update per frame. */}
            <div className="absolute inset-0" style={{ clipPath: "inset(0 calc(100% - var(--played)) 0 0)" }}>
              <Bars peaks={peaks} barClassName="bg-foreground" />
            </div>
          </Slider.Track>
        ) : (
          <Slider.Track className="h-1 w-full rounded-full bg-border">
            <Slider.Indicator
              className={cn(
                "rounded-full bg-muted-foreground transition-[background-color] duration-(--motion-fast)",
                "group-hover/scrubber:bg-foreground",
                "data-[dragging]:bg-foreground",
                "group-has-[:focus-visible]/scrubber:bg-foreground"
              )}
            />
          </Slider.Track>
        )}
        <Slider.Thumb
          className={cn(
            "size-3 rounded-full bg-foreground opacity-0 scale-50",
            "transition-[opacity,scale] duration-(--motion-fast) ease-spring",
            "group-hover/scrubber:opacity-100 group-hover/scrubber:scale-100",
            "data-[dragging]:opacity-100 data-[dragging]:scale-100",
            "has-[:focus-visible]:opacity-100 has-[:focus-visible]:scale-100",
            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:var(--focus-ring,#6B97FF)]",
            "[@media(hover:none)]:opacity-100 [@media(hover:none)]:scale-100"
          )}
          getAriaLabel={() => "Seek"}
          getAriaValueText={(_, v) => `${formatTime(v)} of ${formatTime(duration)}`}
          onKeyDown={handleThumbKeyDown}
        />
      </Slider.Control>
    </Slider.Root>
  );
}

const RATES = [1, 1.25, 1.5, 2] as const;

function MP3PlayerSpeed({ className }: { className?: string }) {
  const { playbackRate, setRate } = usePlayer();

  const cycle = () => {
    const index = RATES.indexOf(playbackRate as (typeof RATES)[number]);
    setRate(RATES[(index + 1) % RATES.length]);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      // Fixed width: "1.25×" is wider than "1×", and the row must not shift.
      className={cn("w-14 px-0 tabular-nums", className)}
      onClick={cycle}
      aria-label={`Playback speed ${playbackRate}×`}
    >
      {playbackRate}×
    </Button>
  );
}

function MP3PlayerDownload({ className }: { className?: string }) {
  const { src } = usePlayer();
  const DownloadIcon = useIcon("download");
  // Saves under the file's own name rather than the last URL segment verbatim.
  const filename = src.split("/").pop()?.split("?")[0] || "audio.mp3";

  return (
    <Button asChild variant="ghost" size="icon" className={className}>
      <a href={src} download={filename} aria-label="Download">
        <DownloadIcon size={16} className="size-4" />
      </a>
    </Button>
  );
}

export {
  MP3Player,
  MP3PlayerPlay,
  MP3PlayerTime,
  MP3PlayerScrubber,
  MP3PlayerSpeed,
  MP3PlayerDownload,
  formatTime,
  resamplePeaks,
  type MP3PlayerProps,
  type MP3PlayerTimeProps,
  type MP3PlayerScrubberProps,
};
