import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import {
  Editor,
  TLEventMapHandler,
  Tldraw,
  HistoryEntry,
  TLRecord,
} from "tldraw";
import "tldraw/tldraw.css";
import { useInterval } from "usehooks-ts";
import { hasShapeChanges, applyTimeLineChange } from "../diffs";
import Playback from "./components/Playback";
import { PlaybackDirections } from "./components/types";

// There's a guide at the bottom of this file!

export default function StoreEventsExample() {
  const [editor, setEditor] = useState<Editor>();
  const [diffs, setDiffs] = useState<HistoryEntry<TLRecord>[]>(
    [] as HistoryEntry<TLRecord>[]
  );
  const [currentDiff, setCurrentDiff] = useState<number>(0);
  const setAppToState = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);
  const [storeEvents, setStoreEvents] = useState<string[]>([]);
  // const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackDirection, setPlaybackDirection] = useState<number>(
    PlaybackDirections.Paused
  );
  const isPlaying = playbackDirection !== PlaybackDirections.Paused;

  useInterval(
    () => {
      if (!(editor && isPlaying)) {
        return;
      }
      const recordToApply = diffs[currentDiff];
      if (!recordToApply) return;

      requestAnimationFrame(() => {
        applyTimeLineChange(recordToApply, editor, playbackDirection);

        setCurrentDiff((prev) => {
          const nextDiff = prev + playbackDirection;
          if (nextDiff < 0 || nextDiff >= diffs.length) {
            setPlaybackDirection(PlaybackDirections.Paused);
            return Math.max(0, Math.min(diffs.length - 1, nextDiff));
          }
          return nextDiff;
        });
      });
    },
    isPlaying ? 100 : null
  );

  useEffect(() => {
    if (!editor || isPlaying) return;

    function logChangeEvent(eventName: string) {
      setStoreEvents((events) => [...events, eventName]);
    }

    //[1]
    const handleChangeEvent: TLEventMapHandler<"change"> = (
      change: HistoryEntry<TLRecord>
    ) => {
      if (hasShapeChanges(change) && !isPlaying) {
        setDiffs((prev) => {
          return [...prev, change];
        });
      }

      for (const record of Object.values(change.changes.added)) {
        if (record.typeName === "shape") {
          logChangeEvent(`created shape (${record.id})\n`);
        }
      }

      // Updated
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (
          from.typeName === "instance" &&
          to.typeName === "instance" &&
          from.currentPageId !== to.currentPageId
        ) {
          logChangeEvent(
            `changed page (${from.currentPageId}, ${to.currentPageId})`
          );
        } else if (from.id.startsWith("shape") && to.id.startsWith("shape")) {
          let diff = _.reduce(
            from,
            (result: any[], value, key: string) =>
              _.isEqual(value, (to as any)[key])
                ? result
                : result.concat([key, (to as any)[key]]),
            []
          );
          if (diff?.[0] === "props") {
            diff = _.reduce(
              (from as any).props,
              (result: any[], value, key) =>
                _.isEqual(value, (to as any).props[key])
                  ? result
                  : result.concat([key, (to as any).props[key]]),
              []
            );
          }
          logChangeEvent(
            `${from.id} updated shape (${JSON.stringify(diff)})\n`
          );
        }
      }

      // Removed
      for (const record of Object.values(change.changes.removed)) {
        if (record.typeName === "shape") {
          logChangeEvent(`deleted shape (${record.id})\n`);
        }
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

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "60%", height: "100vh" }}>
        <Tldraw onMount={setAppToState} />
      </div>
      <div
        style={{
          width: "40%",
          height: "100vh",
          padding: 8,
          background: "#eee",
          border: "none",
          fontFamily: "monospace",
          fontSize: 12,
          borderLeft: "solid 2px #333",
          display: "flex",
          flexDirection: "column-reverse",
          overflow: "auto",
        }}
        onCopy={(event) => event.stopPropagation()}
      >
        {editor && (
          <Playback
            diffs={diffs}
            setDiffs={setDiffs}
            currentDiff={currentDiff}
            setCurrentDiff={setCurrentDiff}
            editor={editor}
            isPlaying={isPlaying}
            playbackDirection={playbackDirection}
            setPlaybackDirection={setPlaybackDirection}
          />
        )}

        <pre>{storeEvents}</pre>
      </div>
    </div>
  );
}
