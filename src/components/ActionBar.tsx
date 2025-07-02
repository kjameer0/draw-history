import React from "react";
import { PlaybackDirections } from "./types";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FastRewindIcon from "@mui/icons-material/FastRewind";

type Props = {
  isPlaying: boolean;
  setPlaybackDirection: React.Dispatch<React.SetStateAction<number>>;
};

export default function ActionBar({ isPlaying, setPlaybackDirection }: Props) {
  const handlePlaybackClick = (direction: number) => {
    setPlaybackDirection(direction);
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <IconButton
        onClick={() =>
          handlePlaybackClick(
            isPlaying ? PlaybackDirections.Paused : PlaybackDirections.Rewind
          )
        }
        aria-label={isPlaying ? "Pause" : "Rewind"}
      >
        {isPlaying ? <PauseIcon /> : <FastRewindIcon />}
      </IconButton>
      <IconButton
        onClick={() =>
          handlePlaybackClick(
            isPlaying ? PlaybackDirections.Paused : PlaybackDirections.Forward
          )
        }
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
    </div>
  );
}
