import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import {
  Editor,
  TLEventMapHandler,
  Tldraw,
  HistoryEntry,
  TLRecord,
  TLShapeId,
  TLShape,
  TLShapePartial,
} from "tldraw";
import "tldraw/tldraw.css";
import { useInterval } from "usehooks-ts";

// There's a guide at the bottom of this file!

export default function StoreEventsExample() {
  const [editor, setEditor] = useState<Editor>();
  const [diffs, setDiffs] = useState<HistoryEntry<TLRecord>[]>(
    [] as HistoryEntry<TLRecord>[]
  );
  const [delay, setDelay] = useState<null | number>(null);
  const [currentDiff, setCurrentDiff] = useState<number>(0);
  const setAppToState = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const [storeEvents, setStoreEvents] = useState<string[]>([]);

  useInterval(() => {
    function executeCallback() {
      console.log(currentDiff);
      const change = diffs[currentDiff];
      if (change === undefined) {
        setDelay(null);
        return;
      }
      const allChanges = change.changes;
      const { updated, added } = allChanges;
      const keys = Object.keys(updated);
      const shape = keys.filter((key) => key.includes("shape:"));
      console.log(updated);
      if (shape.length === 0) return;
      const shapeId: TLShapeId = shape[0] as TLShapeId;
      const shapeObj = updated[shapeId];
      const to = shapeObj[1];
      if (isTLShapePartial(to)) {
        editor?.updateShape(to);
      }
    }
    executeCallback();
    setCurrentDiff((prev) => prev + 1);
  }, delay);

  useEffect(() => {
    if (!editor) return;

    function logChangeEvent(eventName: string) {
      setStoreEvents((events) => [...events, eventName]);
    }

    //[1]
    const handleChangeEvent: TLEventMapHandler<"change"> = (
      change: HistoryEntry<TLRecord>
    ) => {
      if (JSON.stringify(change).includes("shape")) {
        console.log(change);
      }
      // Added
      setDiffs((prev) => [...prev, change]);
      // console.log(change.changes);
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
  }, [editor]);

  async function handlePlaybackClick() {
    setDelay(typeof delay === "number" ? null : 100);
  }
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
        <button onClick={handlePlaybackClick}>playback</button>
        <pre>{storeEvents}</pre>
      </div>
    </div>
  );
}

function isTLShapePartial<T extends TLShape>(
  obj: any
): obj is TLShapePartial<T> {
  if (typeof obj !== "object" || obj === null) return false;
  if (typeof obj.id !== "string") return false;
  if ("meta" in obj && typeof obj.meta !== "object") return false;
  if ("props" in obj && typeof obj.props !== "object") return false;
  return true;
}
