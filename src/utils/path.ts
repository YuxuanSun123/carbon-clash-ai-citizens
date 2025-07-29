export type GridType =
  | "build"
  | "event"
  | "tax"
  | "nature"
  | "policy"
  | "trap";

export interface PathCell {
  row: number;
  col: number;
  type: GridType;
}

export const pathCoordinates: PathCell[] = [
  { row: 0, col: 0, type: "build" },
  { row: 0, col: 1, type: "build" },
  { row: 0, col: 2, type: "event" },
  { row: 0, col: 3, type: "build" },
  { row: 0, col: 4, type: "policy" },
  { row: 0, col: 5, type: "build" },
  { row: 0, col: 6, type: "tax" },
  { row: 0, col: 7, type: "build" },

  { row: 1, col: 7, type: "build" },
  { row: 2, col: 7, type: "nature" },
  { row: 3, col: 7, type: "build" },
  { row: 4, col: 7, type: "event" },
  { row: 5, col: 7, type: "build" },
  { row: 6, col: 7, type: "trap" },
  { row: 7, col: 7, type: "build" },

  { row: 7, col: 6, type: "build" },
  { row: 7, col: 5, type: "build" },
  { row: 7, col: 4, type: "policy" },
  { row: 7, col: 3, type: "event" },
  { row: 7, col: 2, type: "build" },
  { row: 7, col: 1, type: "tax" },
  { row: 7, col: 0, type: "build" },

  { row: 6, col: 0, type: "build" },
  { row: 5, col: 0, type: "event" },
  { row: 4, col: 0, type: "nature" },
  { row: 3, col: 0, type: "build" },
  { row: 2, col: 0, type: "trap" },
  { row: 1, col: 0, type: "build" },
];
