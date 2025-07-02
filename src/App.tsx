import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Editor,
  TLEventMapHandler,
  Tldraw,
  HistoryEntry,
  TLRecord,
} from "tldraw";
import "tldraw/tldraw.css";
import { hasShapeChanges, applyTimeLineChange } from "../diffs";
import { PlaybackDirections } from "./components/types";
import ActionBar from "./components/ActionBar";
import { Slider } from "@mui/material";

export default function App() {
  const setAppToState = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);
  const [editor, setEditor] = useState<Editor>();
  const [diffs, setDiffs] = useState<HistoryEntry<TLRecord>[]>([]);
  const framesRef = useRef<HistoryEntry<TLRecord>[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const [playbackDirection, setPlaybackDirection] = useState<number>(
    PlaybackDirections.Paused
  );

  const isPlaying = playbackDirection !== PlaybackDirections.Paused;
  const ActionBarMemoized = useMemo(() => {
    return () => ActionBar({ isPlaying, setPlaybackDirection });
  }, [setPlaybackDirection, isPlaying]);

  const currentDiffRef = useRef<number>(0);
  const [currentDiff, setCurrentDiff] = useState<number>(0);
  //main logic for playing back recordings
  useEffect(() => {
    if (!isPlaying || !editor) return;

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
  }, [isPlaying, editor, diffs, playbackDirection]);

  useEffect(() => {
    if (!isPlaying) {
      setCurrentDiff(currentDiffRef.current);
      return;
    }
    const interval = setInterval(() => {
      setCurrentDiff(currentDiffRef.current);
    }, 100); // 10 FPS updates are smooth enough
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!editor || isPlaying) return;

    //[1]
    const handleChangeEvent: TLEventMapHandler<"change"> = (
      change: HistoryEntry<TLRecord>
    ) => {
      if (isPlaying) return;

      if (hasShapeChanges(change)) {
        framesRef.current.push(change);
        clearTimeout(debounceRef.current);

        const timeoutId = setTimeout(() => {
          setDiffs((prev) => {
            const nextDiffs = [...prev, ...framesRef.current];
            framesRef.current.length = 0;
            return nextDiffs;
          });
        }, 200);

        debounceRef.current = timeoutId;
      }
    };

    // [2]
    const cleanupFunction = editor.store.listen(handleChangeEvent, {
      source: "user",
      scope: "all",
    });

    return () => {
      cleanupFunction();
    };
  }, [editor, isPlaying]);
  function handleSliderChange(value: number) {
    // console.log(Object.keys(ev.target));
    setCurrentDiff((prev) => {
      currentDiffRef.current = value;
      return value;
    });
  }

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
          onChange={(e, value: number) => {
            currentDiffRef.current = value;
            setCurrentDiff(value);
          }}
          max={diffs.length - 1}
          min={0}
          onChangeCommitted={(
            event: React.SyntheticEvent | Event,
            value: number
          ) => {
            handleSliderChange(value);
          }}
        />
      </div>
    </div>
  );
}
