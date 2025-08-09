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
  // 顶边 (0-9)
  { row: 0, col: 0, type: "build" },   // 0 - 起点
  { row: 0, col: 1, type: "build" },   // 1
  { row: 0, col: 2, type: "event" },   // 2
  { row: 0, col: 3, type: "build" },   // 3
  { row: 0, col: 4, type: "policy" },  // 4
  { row: 0, col: 5, type: "build" },   // 5
  { row: 0, col: 6, type: "tax" },     // 6
  { row: 0, col: 7, type: "build" },   // 7
  { row: 0, col: 8, type: "event" },   // 8
  { row: 0, col: 9, type: "build" },   // 9
  { row: 0, col: 10, type: "build" },  // 10 - 监狱

  // 右边 (11-19)
  { row: 1, col: 10, type: "build" },  // 11
  { row: 2, col: 10, type: "nature" }, // 12
  { row: 3, col: 10, type: "build" },  // 13
  { row: 4, col: 10, type: "event" },  // 14
  { row: 5, col: 10, type: "build" },  // 15
  { row: 6, col: 10, type: "trap" },   // 16
  { row: 7, col: 10, type: "build" },  // 17
  { row: 8, col: 10, type: "policy" }, // 18
  { row: 9, col: 10, type: "build" },  // 19
  { row: 10, col: 10, type: "build" }, // 20 - 免费停车

  // 底边 (21-29)
  { row: 10, col: 9, type: "build" },  // 21
  { row: 10, col: 8, type: "build" },  // 22
  { row: 10, col: 7, type: "policy" }, // 23
  { row: 10, col: 6, type: "event" },  // 24
  { row: 10, col: 5, type: "build" },  // 25
  { row: 10, col: 4, type: "tax" },    // 26
  { row: 10, col: 3, type: "build" },  // 27
  { row: 10, col: 2, type: "nature" }, // 28
  { row: 10, col: 1, type: "build" },  // 29
  { row: 10, col: 0, type: "build" },  // 30 - 警察局

  // 左边 (31-39)
  { row: 9, col: 0, type: "build" },   // 31
  { row: 8, col: 0, type: "event" },   // 32
  { row: 7, col: 0, type: "nature" },  // 33
  { row: 6, col: 0, type: "build" },   // 34
  { row: 5, col: 0, type: "trap" },    // 35
  { row: 4, col: 0, type: "build" },   // 36
  { row: 3, col: 0, type: "policy" },  // 37
  { row: 2, col: 0, type: "build" },   // 38
  { row: 1, col: 0, type: "event" },   // 39
];
