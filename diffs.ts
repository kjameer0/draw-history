import { update } from "lodash";
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
} from "tldraw";

type TLShapeAction = {
  actionType: "added" | "removed" | "updated";
  shapeProperties: TLShapePartial;
};
//returns a [from, to] array
export function extractShapeUpdates(
  change: HistoryEntry<TLRecord>
): TLShapePartial[] {
  const { updated } = change.changes;
  //take each update
  const shapeChanges = Object.values(updated).filter((diff) => {
    //individual from to array
    return diff[0].id.includes("shape");
  });
  return shapeChanges.map((update) => {
    const to = update[1];
    if (isTLShapePartial<TLDefaultShape>(to)) {
      return to;
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

export function* applyTimeLineChanges(
  historyEntries: HistoryEntry<TLRecord>[],
  editor: Editor
) {
  //iterate each entry
  //pull out updated
  for (const historyRecord of historyEntries) {
    const additions = extractShapeAdditions(historyRecord);
    const updates = extractShapeUpdates(historyRecord);
    const removals = extractShapeRemovals(historyRecord);

    editor.createShapes(additions);
    editor.updateShapes(updates);
    editor.deleteShapes(removals);
    yield;
  }
  //
}
//extract pointer updates
//extract instance updates

//apply changes? (take editory as input)
function isTLShapePartial<T extends TLShape>(
  obj: any
): obj is TLShapePartial<T> {
  if (typeof obj !== "object" || obj === null) return false;
  if (typeof obj.id !== "string") return false;
  if ("meta" in obj && typeof obj.meta !== "object") return false;
  if ("props" in obj && typeof obj.props !== "object") return false;
  return true;
}

//
