import { extractShapeUpdates } from "../diffs";
import { HistoryEntry, TLPointerId, TLRecord } from "tldraw";
import { mockChangeOneShape, mockChangeTwoShapes } from "./data";
//TODO: write more UTIL FUNCTIONS
describe("extractShapeUpdates", () => {
  it('should return only updates where the id includes "shape"', () => {
    const result = extractShapeUpdates(mockChangeOneShape);

    expect(result).toHaveLength(1);
    const [from, to] = result[0];
    expect(from.id).toContain("shape");
    expect(to.id).toContain("shape");
  });
  it("should return updates for multiple shapes that have changed", () => {
    const result = extractShapeUpdates(mockChangeTwoShapes);

    expect(result).toHaveLength(2);
    const [from, to] = result[0];
    const [from2, to2] = result[0];
    expect(from.id).toContain("shape");
    expect(to.id).toContain("shape");
    expect(from2.id).toContain("shape");
    expect(to2.id).toContain("shape");
  });
});
