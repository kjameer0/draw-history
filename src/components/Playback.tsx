import React from "react";
import { Editor, HistoryEntry, TLRecord } from "tldraw";
import { PlaybackDirections } from "./types";
type props = {
  diffs: HistoryEntry<TLRecord>[];
  setDiffs: React.Dispatch<React.SetStateAction<HistoryEntry<TLRecord>[]>>;
  currentDiff: number;
  editor: Editor;
  isPlaying: boolean;
  playbackDirection: number;
  setPlaybackDirection: React.Dispatch<React.SetStateAction<number>>;
};
export default function Playback({
  // diffs,
  // currentDiff,
  // setCurrentDiff,

  isPlaying,
  // playbackDirection,
  setPlaybackDirection,
}: props) {
  function handlePlaybackClick(playbackDirectionValue: number) {
    // if (editor) {
    //   editor.blur();
    // }
    setPlaybackDirection(playbackDirectionValue);
  }
  return (
    <>
      <button
        onClick={() =>
          handlePlaybackClick(
            isPlaying ? PlaybackDirections.Paused : PlaybackDirections.Forward
          )
        }
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button
        onClick={() =>
          handlePlaybackClick(
            isPlaying ? PlaybackDirections.Paused : PlaybackDirections.Rewind
          )
        }
      >
        {isPlaying ? "Pause" : "Rewind"}
      </button>
    </>
  );
}
