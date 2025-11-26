interface DotPadDisplayProps {
  mainData: string; // 예: "000220000220000220..."
  subData: string;  // 하단 작은 디스플레이용
}

/**
 * DotPadDisplay
 * 닷패드(60x40) 데이터를 div 형태로 시각화하는 컴포넌트
 * - 점(핀)은 4px x 4px의 정사각형으로 표현
 * - 눌린 핀은 중앙에 검은 원으로 표시
 */
export default function DotPadDisplay({ mainData = "", subData = "" }: DotPadDisplayProps){
  const MAIN_CELL_COLS = 30;
  const MAIN_CELL_ROWS = 10;
  const MAIN_DOTS_X = 60;
  const MAIN_DOTS_Y = 40;

  // 서브 (20x1 셀)
  const SUB_CELL_COLS = 20;
  const SUB_CELL_ROWS = 1;
  const SUB_DOTS_X = 40;
  const SUB_DOTS_Y = 4;

  // 닷패드 전용 16진수 → 4핀 매핑
  const HEX_TO_PINS: Record<string, number[]> = {
    "0": [0, 0, 0, 0],
    "1": [1, 0, 0, 0],
    "2": [0, 1, 0, 0],
    "3": [1, 1, 0, 0],
    "4": [0, 0, 1, 0],
    "5": [1, 0, 1, 0],
    "6": [0, 1, 1, 0],
    "7": [1, 1, 1, 0],
    "8": [0, 0, 0, 1],
    "9": [1, 0, 0, 1],
    "a": [0, 1, 0, 1],
    "b": [1, 1, 0, 1],
    "c": [0, 0, 1, 1],
    "d": [1, 0, 1, 1],
    "e": [0, 1, 1, 1],
    "f": [1, 1, 1, 1],
  };

  const decodeCell = (hexPair: string): number[][] => {
    if (hexPair.length !== 2) return Array.from({ length: 4 }, () => [0, 0]);
    const [rightHex, leftHex] = hexPair.toLowerCase().split("");
    const leftPins = HEX_TO_PINS[leftHex] || [0, 0, 0, 0];
    const rightPins = HEX_TO_PINS[rightHex] || [0, 0, 0, 0];

    const cell: number[][] = [];
    for (let i = 0; i < 4; i++) {
      cell.push([leftPins[i], rightPins[i]]);
    }
    return cell;
  };

  // 디스플레이 생성 함수
  const buildGrid = (
    data: string,
    cellCols: number,
    cellRows: number,
    dotsX: number,
    dotsY: number
  ) => {
    const safeData = data || "";
    const dotsGrid: number[][] = Array.from({ length: dotsY }, () =>
      Array(dotsX).fill(0)
    );

    for (let cellY = 0; cellY < cellRows; cellY++) {
      for (let cellX = 0; cellX < cellCols; cellX++) {
        const idx = cellY * cellCols + cellX;
        const hexPair = safeData.slice(idx * 2, idx * 2 + 2);
        const cell = decodeCell(hexPair);

        for (let row = 0; row < 4; row++) {
          dotsGrid[cellY * 4 + row][cellX * 2] = cell[row][0];
          dotsGrid[cellY * 4 + row][cellX * 2 + 1] = cell[row][1];
        }
      }
    }
    return dotsGrid;
  };

  const mainGrid = buildGrid(
    mainData,
    MAIN_CELL_COLS,
    MAIN_CELL_ROWS,
    MAIN_DOTS_X,
    MAIN_DOTS_Y
  );
  const subGrid = buildGrid(
    subData,
    SUB_CELL_COLS,
    SUB_CELL_ROWS,
    SUB_DOTS_X,
    SUB_DOTS_Y
  );

  return (
    <div className="dotpad-container">
      {/* 메인 디스플레이 */}
      <div className="dotpad-wrapper">
        <div
          className="dotpad-grid"
          style={{
            gridTemplateColumns: `repeat(${MAIN_DOTS_X}, 12px)`,
            gridTemplateRows: `repeat(${MAIN_DOTS_Y}, 12px)`,
          }}
        >
          {mainGrid.flat().map((isActive, i) => (
            <div key={i} className="dot-cell">
              {isActive ? <div className="dot-active" /> : null}
            </div>
          ))}
        </div>
      </div>

      {/* 서브 디스플레이 */}
      <div className="dotpad-sub-wrapper">
        <div
          className="dotpad-grid"
          style={{
            gridTemplateColumns: `repeat(${SUB_DOTS_X}, 12px)`,
            gridTemplateRows: `repeat(${SUB_DOTS_Y}, 12px)`,
          }}
        >
          {subGrid.flat().map((isActive, i) => (
            <div key={i} className="dot-cell">
              {isActive ? <div className="dot-active" /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
