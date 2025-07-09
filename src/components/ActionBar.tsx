import React from "react";
import { PlaybackDirections } from "./types";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import { Button } from "@mui/material";

type Props = {
  isPlaying: boolean;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  setPlaybackDirection: React.Dispatch<React.SetStateAction<number>>;
  handlePlaybackClick: (direction: number) => void;
};

export default function ActionBar({
  isPlaying,
  isRecording,
  setIsRecording,
  setPlaybackDirection,
  handlePlaybackClick,
}: Props) {
  function handleRecordClick() {
    setIsRecording((prev) => !prev);
  }
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <IconButton
        disabled={isRecording}
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
        disabled={isRecording}
        onClick={() =>
          handlePlaybackClick(
            isPlaying ? PlaybackDirections.Paused : PlaybackDirections.Forward
          )
        }
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      {!isPlaying && (
        <Button onClick={handleRecordClick}>
          {isRecording ? "Stop Recording" : "Record"}
        </Button>
      )}
    </div>
  );
}
