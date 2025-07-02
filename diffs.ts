import {
  Editor,
  TLEventMapHandler,
  Tldraw,
  HistoryEntry,
  TLRecord,
  TLShapeId,
  TLShape,
  TLShapePartial,
  TLDrawShape,
  TLDefaultShape,
  TLPointerId,
  TLInstanceId,
} from "tldraw";

//returns a [from, to] array
export function extractShapeUpdates(
  change: HistoryEntry<TLRecord>
): TLShapePartial[] {
  const { updated } = change.changes;
  //take each update
  const diffs = Object.values(updated);
  const shapeChanges: TLRecord[] = Array(diffs.length);
  for (let i = 0; i < diffs.length; i++) {
    const diff = diffs[i];
    if (diff[0].id.includes("shape")) {
      shapeChanges[i] = diff[1];
    }
  }

  return shapeChanges.map((update) => {
    if (isTLShapePartial<TLDefaultShape>(update)) {
      return update;
    } else {
      throw new Error("shape is not compatible");
    }
  });
}

export function extractShapeAdditions(change: HistoryEntry<TLRecord>) {
  const { added } = change.changes;
  const shapeChanges = Object.values(added).filter((diff) => {
    return diff.id.includes("shape");
  });
  return shapeChanges.map((addition) => {
    if (isTLShapePartial<TLDefaultShape>(addition)) {
      return addition;
    } else {
      throw new Error("shape is not compatible");
    }
  });
}

export function extractShapeRemovals(change: HistoryEntry<TLRecord>) {
  const { removed } = change.changes;
  const shapeChanges = Object.values(removed).filter((diff) => {
    return diff.id.includes("shape");
  });
  return shapeChanges.map((removal) => {
    if (isTLShapePartial<TLDefaultShape>(removal)) {
      return removal;
    } else {
      throw new Error("shape is not compatible");
    }
  });
}

//used to pass TLrecord to editor as an actual shape
function isTLShapePartial<T extends TLShape>(
  obj: any
): obj is TLShapePartial<T> {
  if (typeof obj !== "object" || obj === null) return false;
  if (typeof obj.id !== "string") return false;
  if ("meta" in obj && typeof obj.meta !== "object") return false;
  if ("props" in obj && typeof obj.props !== "object") return false;
  return true;
}

//make sure some geometry on screen has changed, if not then the changes would be changes to the user's cursor position, which is unnecessary
export function hasShapeChanges(change: HistoryEntry<TLRecord>): boolean {
  const { updated, added, removed } = change.changes;
  for (const id in updated) {
    if (id.includes("shape")) return true;
  }
  for (const id in added) {
    if (id.includes("shape")) return true;
  }
  for (const id in removed) {
    if (id.includes("shape")) return true;
  }
  return false;
}

//take a single history event and apply its changes to
//the canvas
export function applyTimeLineChange(
  historyRecord: HistoryEntry<TLRecord>,
  editor: Editor,
  playbackDirection: number
) {
  const additions = extractShapeAdditions(historyRecord);
  const updates = extractShapeUpdates(historyRecord);
  const removals = extractShapeRemovals(historyRecord);
  // console.log("Additons,", additions);
  // console.log("updates,", updates);
  // console.log("Removals,", removals);
  editor.run(() => {
    if (playbackDirection < 0) {
      if (removals.length > 0) {
        editor.createShapes(removals);
      }
      if (updates.length > 0) {
        editor.updateShapes(updates);
      }
      if (additions.length > 0) {
        editor.deleteShapes(additions);
      }
    } else if (playbackDirection > 0) {
      if (additions.length > 0) {
        editor.createShapes(additions);
      }
      if (updates.length > 0) {
        editor.updateShapes(updates);
      }
      if (removals.length > 0) {
        editor.deleteShapes(removals);
      }
    }
  });
}
