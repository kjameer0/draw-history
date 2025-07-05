import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor, Tldraw, HistoryEntry, TLRecord } from "tldraw";
import "tldraw/tldraw.css";
import {
  hasShapeChanges,
  applyTimeLineChange,
  applyMultipleTimeLineChanges,
} from "../diffs";
import { PlaybackDirections } from "./components/types";
import ActionBar from "./components/ActionBar";
import { Slider } from "@mui/material";

export default function App() {
  const setAppToState = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);
  const [editor, setEditor] = useState<Editor>();
  const [diffs, setDiffs] = useState<HistoryEntry<TLRecord>[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const framesRef = useRef<HistoryEntry<TLRecord>[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const [playbackDirection, setPlaybackDirection] = useState<number>(
    PlaybackDirections.Paused
  );
  const isPlaying = playbackDirection !== PlaybackDirections.Paused;

  const editorCleanupRef = useRef<() => void>(() => {});

  const currentDiffRef = useRef<number>(0);
  const [currentDiff, setCurrentDiff] = useState<number>(0);

  const ActionBarMemoized = useMemo(() => {
    function handlePlaybackClick(direction: number) {
      if (diffs.length === 0) return;
      if (editor) {
        //set the playback start to be the correct frame in the sequence
        applyMultipleTimeLineChanges(
          diffs,
          0,
          currentDiffRef.current,
          currentDiffRef.current,
          editor,
          PlaybackDirections.SkipAhead
        );
      }

      setPlaybackDirection(direction);
    }
    return () =>
      ActionBar({
        isPlaying,
        isRecording,
        setIsRecording,
        setPlaybackDirection,
        handlePlaybackClick,
      });
  }, [setPlaybackDirection, isPlaying, diffs, isRecording]);

  //main logic for playing back recordings
  useEffect(() => {
    if (!isPlaying || !editor || isRecording) return;

    let frameId: number;

    const tick = () => {
      const recordToApply = diffs[currentDiffRef.current];
      if (!recordToApply) return;

      applyTimeLineChange(recordToApply, editor, playbackDirection);

      const nextDiff = currentDiffRef.current + playbackDirection;
      if (nextDiff < 0 || nextDiff >= diffs.length) {
        setTimeout(() => {
          setPlaybackDirection(PlaybackDirections.Paused);
        }, 0);
        currentDiffRef.current = Math.max(
          0,
          Math.min(diffs.length - 1, nextDiff)
        );
        return;
      }

      currentDiffRef.current = nextDiff;
      frameId = requestAnimationFrame(tick); // Schedule next frame
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isPlaying, editor, diffs, playbackDirection, isRecording]);

  useEffect(() => {
    if (!isPlaying || isRecording) {
      setCurrentDiff(currentDiffRef.current);
      return;
    }
    const interval = setInterval(() => {
      setCurrentDiff(currentDiffRef.current);
    }, 100); // 10 FPS updates are smooth enough
    return () => clearInterval(interval);
  }, [isPlaying, isRecording]);

  useEffect(() => {
    //if we are recording should we clean up? definitely not
    if (!editor) return;
    if (isPlaying) {
      editorCleanupRef.current();
      return;
    }
    // [2]
    const cleanupFunction = editor.store.listen(
      (change: HistoryEntry<TLRecord>) =>
        handleChangeEvent(change, isPlaying, framesRef, debounceRef, setDiffs),
      {
        source: "user",
        scope: "all",
      }
    );
    editorCleanupRef.current = cleanupFunction;

    return () => {
      cleanupFunction();
    };
  }, [editor, isPlaying, diffs, currentDiff]);

  function handleSliderChange(value: number) {
    const oldCurrentDiff = currentDiffRef.current;
    setCurrentDiff(() => {
      currentDiffRef.current = value;
      return value;
    });

    if (editor) {
      applyMultipleTimeLineChanges(
        diffs,
        0,
        value,
        oldCurrentDiff,
        editor,
        playbackDirection
      );
    }
  }
  console.log("render", currentDiff);
  return (
    <div style={{ display: "" }}>
      <div style={{ width: "100%", height: "80vh" }}>
        <Tldraw
          onMount={setAppToState}
          components={{ TopPanel: () => <p>{currentDiff}</p> }}
        />
      </div>
      <div style={{ padding: "10px" }}>
        <ActionBarMemoized />
        <Slider
          sx={{ width: "90%" }}
          aria-label="Volume"
          value={currentDiff}
          onChange={(_, value: number) => {
            currentDiffRef.current = value;
            setCurrentDiff(value);
          }}
          max={diffs.length - 1}
          min={0}
          onChangeCommitted={(
            _: React.SyntheticEvent | Event,
            value: number
          ) => {
            handleSliderChange(value);
          }}
        />
      </div>
    </div>
  );
}

const handleChangeEvent = (
  change: HistoryEntry<TLRecord>,
  isPlaying: boolean,
  framesRef: React.RefObject<HistoryEntry<TLRecord>[]>,
  debounceRef: React.RefObject<NodeJS.Timeout | undefined>,
  setDiffs: React.Dispatch<React.SetStateAction<HistoryEntry<TLRecord>[]>>
) => {
  if (isPlaying) return;

  if (hasShapeChanges(change)) {
    //this if check is added to make sure no new diffs are added when someone skips in the timeline
    if (
      "instance_page_state:page:page" in change.changes.updated &&
      Object.keys(change.changes.added).length === 0 &&
      Object.keys(change.changes.removed).length === 0
    ) {
      return;
    }
    framesRef.current.push(change);
    clearTimeout(debounceRef.current);

    const timeoutId = setTimeout(() => {
      setDiffs((prev) => {
        const nextDiffs = [...prev, ...framesRef.current];
        framesRef.current.length = 0;
        return nextDiffs;
      });
    }, 300);

    debounceRef.current = timeoutId;
  }
};
