import { Scene } from "phaser";

export class Game extends Scene {
  scoreText: Phaser.GameObjects.Text;
  timeText: Phaser.GameObjects.Text;
  fruitGrid: (Phaser.GameObjects.Image | null)[][];
  rows: number;
  cols: number;
  cellSize: number;
  gap: number;
  fruits: string[];
  selectedTile: Phaser.GameObjects.Image | null = null;
  score: number = 0;
  isBusy: boolean = false;

  constructor() {
    super("Game");
    this.fruitGrid = [];
    this.rows = 8;
    this.cols = 6;
    this.cellSize = 180;
    this.gap = 5;
    this.fruits = ["FRUIT1", "FRUIT2", "FRUIT3", "FRUIT4"];
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    this.add
      .image(0, 0, "BG_PLAY")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);

    this.createUI(gameWidth);
    this.createFruitGrid(); // 🔥 now it actually creates the fruit grid

    this.resolveMatches();
  }

  createUI(gameWidth: number) {
    // Coin background
    this.add
      .image(gameWidth - 280, 370, "COIN_BG")
      .setOrigin(0.5, 0.5)
      .setScale(1.2)
      .setAlpha(1);

    // Time background
    this.add
      .image(300, 370, "TIME_BG")
      .setOrigin(0.5, 0.5)
      .setScale(1.2)
      .setAlpha(1);

    // Score text
    this.scoreText = this.add
      .text(gameWidth - 200, 355, "0", {
        fontSize: "65px",
        fontFamily: "Prompt",
      })
      .setOrigin(0.5, 0.5)
      .setStroke("#673606", 10);

    // Time text
    this.timeText = this.add
      .text(390, 355, "00:30", {
        fontSize: "65px",
        fontFamily: "Prompt",
      })
      .setOrigin(0.5, 0.5)
      .setStroke("#673606", 10);
  }

  createFruitGrid() {
    for (let row = 0; row < this.rows; row++) {
      this.fruitGrid[row] = [];

      for (let col = 0; col < this.cols; col++) {
        const fruitKey = Phaser.Utils.Array.GetRandom(this.fruits);
        const x = 140 + col * (this.cellSize + this.gap);
        const y = 800 + row * (this.cellSize + this.gap);

        const fruit = this.add
          .image(x, y, fruitKey)
          .setDisplaySize(this.cellSize, this.cellSize)
          .setData({ row, col, fruitKey })
          .setInteractive();

        this.setupTileDrag(fruit);

        this.fruitGrid[row][col] = fruit;
      }
    }
  }

  findMatches(): Phaser.GameObjects.Image[] {
    const matches: Set<Phaser.GameObjects.Image> = new Set();

    // Horizontal match detection
    for (let row = 0; row < this.rows; row++) {
      let matchCount = 1;

      for (let col = 1; col < this.cols; col++) {
        const current = this.fruitGrid[row][col];
        const previous = this.fruitGrid[row][col - 1];

        const currKey = current?.getData("fruitKey");
        const prevKey = previous?.getData("fruitKey");

        if (current && previous && currKey === prevKey) {
          matchCount++;
        } else {
          if (matchCount >= 3 && previous) {
            for (let i = 0; i < matchCount; i++) {
              const matchTile = this.fruitGrid[row][col - 1 - i];
              if (matchTile) matches.add(matchTile);
            }
          }
          matchCount = 1;
        }
      }

      // Check at end of row
      if (matchCount >= 3) {
        for (let i = 0; i < matchCount; i++) {
          const matchTile = this.fruitGrid[row][this.cols - 1 - i];
          if (matchTile) matches.add(matchTile);
        }
      }
    }

    // Vertical match detection
    for (let col = 0; col < this.cols; col++) {
      let matchCount = 1;

      for (let row = 1; row < this.rows; row++) {
        const current = this.fruitGrid[row][col];
        const previous = this.fruitGrid[row - 1][col];

        const currKey = current?.getData("fruitKey");
        const prevKey = previous?.getData("fruitKey");

        if (current && previous && currKey === prevKey) {
          matchCount++;
        } else {
          if (matchCount >= 3 && previous) {
            for (let i = 0; i < matchCount; i++) {
              const matchTile = this.fruitGrid[row - 1 - i][col];
              if (matchTile) matches.add(matchTile);
            }
          }
          matchCount = 1;
        }
      }

      // Check at end of column
      if (matchCount >= 3) {
        for (let i = 0; i < matchCount; i++) {
          const matchTile = this.fruitGrid[this.rows - 1 - i][col];
          if (matchTile) matches.add(matchTile);
        }
      }
    }

    return Array.from(matches);
  }

  async removeMatchedTiles(matched: Phaser.GameObjects.Image[]): Promise<void> {
    const delay = 500; // milliseconds

    matched.forEach((tile) => {
      const fruitKey = tile.getData("fruitKey");
      const activeKey = `${fruitKey}-ACTIVE`;

      if (this.textures.exists(activeKey)) {
        tile.setTexture(activeKey); // 🔄 switch to -ACTIVE texture
      }
    });

    // ⏳ Wait for short delay before removing
    await new Promise((resolve) => this.time.delayedCall(delay, resolve));

    matched.forEach((tile) => {
      const row = tile.getData("row");
      const col = tile.getData("col");

      this.fruitGrid[row][col] = null; // 🧱 clear from grid
      tile.destroy(); // 💥 remove from scene
    });
  }

  dropTiles(): Promise<void> {
    return new Promise((resolve) => {
      const animations: Phaser.Tweens.Tween[] = [];
      const tileSize = this.cellSize + this.gap;

      for (let col = 0; col < this.cols; col++) {
        let emptyRow = this.rows - 1;

        for (let row = this.rows - 1; row >= 0; row--) {
          const tile = this.fruitGrid[row][col];

          if (tile === null) continue;

          if (emptyRow !== row) {
            const newY = 800 + emptyRow * tileSize;

            this.fruitGrid[emptyRow][col] = tile;
            this.fruitGrid[row][col] = null;

            tile.setData("row", emptyRow);

            animations.push(
              this.tweens.add({
                targets: tile,
                y: newY,
                duration: 200,
                ease: "Cubic.easeInOut",
              })
            );
          }

          emptyRow--;
        }
      }

      // Wait for animations to finish
      this.time.delayedCall(220, () => resolve());
    });
  }

  async fillEmptyTiles(): Promise<void> {
    const tileSize = this.cellSize + this.gap;
    const animations: Promise<void>[] = [];

    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        if (this.fruitGrid[row][col] === null) {
          const fruitKey = Phaser.Utils.Array.GetRandom(this.fruits);
          const x = 140 + col * tileSize;
          const y = 800 + row * tileSize;

          const fruit = this.add
            .image(x, y - tileSize * 2, fruitKey)
            .setDisplaySize(this.cellSize, this.cellSize)
            .setData({ row, col, fruitKey })
            .setInteractive();

          this.setupTileDrag(fruit);
          this.fruitGrid[row][col] = fruit;

          // ✅ Wrap tween in a Promise
          animations.push(
            new Promise((resolve) => {
              this.tweens.add({
                targets: fruit,
                y,
                duration: 200,
                ease: "Cubic.easeInOut",
                onComplete: () => resolve(),
              });
            })
          );
        }
      }
    }

    // ✅ Wait for all animations to complete
    await Promise.all(animations);
  }

  snapBack(tile: Phaser.GameObjects.Image) {
    const row = tile.getData("row");
    const col = tile.getData("col");
    const x = 140 + col * (this.cellSize + this.gap);
    const y = 800 + row * (this.cellSize + this.gap);

    this.tweens.add({
      targets: tile,
      x,
      y,
      duration: 200,
      ease: "Cubic.easeOut",
    });
  }

  async resolveMatches(): Promise<void> {
    this.isBusy = true;

    while (true) {
      const matches = this.findMatches();
      if (matches.length === 0) break;

      await this.removeMatchedTiles(matches);
      await this.dropTiles();
      await this.fillEmptyTiles();
    }

    this.isBusy = false;
  }

  areAdjacent(
    tileA: Phaser.GameObjects.Image,
    tileB: Phaser.GameObjects.Image
  ): boolean {
    const rowA = tileA.getData("row");
    const colA = tileA.getData("col");
    const rowB = tileB.getData("row");
    const colB = tileB.getData("col");

    const rowDiff = Math.abs(rowA - rowB);
    const colDiff = Math.abs(colA - colB);

    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  setupTileDrag(tile: Phaser.GameObjects.Image) {
    tile.setInteractive({ draggable: true });
    this.input.setDraggable(tile);

    tile.on("dragstart", (pointer: Phaser.Input.Pointer) => {
      if (this.isBusy) return;
      tile.setData("dragStartX", pointer.x);
      tile.setData("dragStartY", pointer.y);
      tile.setData("originalX", tile.x);
      tile.setData("originalY", tile.y);
      tile.setData("hasSwapped", false); // 🆕 Prevent multiple swaps
    });

    tile.on("drag", async (pointer: Phaser.Input.Pointer) => {
      if (this.isBusy) return;

      const startX = tile.getData("dragStartX");
      const startY = tile.getData("dragStartY");
      const deltaX = pointer.x - startX;
      const deltaY = pointer.y - startY;

      const originalX = tile.getData("originalX");
      const originalY = tile.getData("originalY");

      const row = tile.getData("row");
      const col = tile.getData("col");

      if (tile.getData("hasSwapped")) return;

      // Lock to one direction
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > this.cellSize / 2
      ) {
        // Horizontal drag
        const targetCol = col + (deltaX > 0 ? 1 : -1);
        if (targetCol >= 0 && targetCol < this.cols) {
          const targetTile = this.fruitGrid[row][targetCol];
          if (targetTile) {
            tile.setData("hasSwapped", true);
            await this.trySwapTiles(tile, targetTile);
          }
        }
      } else if (Math.abs(deltaY) > this.cellSize / 2) {
        // Vertical drag
        const targetRow = row + (deltaY > 0 ? 1 : -1);
        if (targetRow >= 0 && targetRow < this.rows) {
          const targetTile = this.fruitGrid[targetRow][col];
          if (targetTile) {
            tile.setData("hasSwapped", true);
            await this.trySwapTiles(tile, targetTile);
          }
        }
      }

      // Lock position so drag doesn’t move visually
      tile.x = originalX;
      tile.y = originalY;
    });

    tile.on("dragend", () => {
      tile.setData("hasSwapped", false);
    });
  }

  async trySwapTiles(
    tileA: Phaser.GameObjects.Image,
    tileB: Phaser.GameObjects.Image
  ) {
    // Swap visually & in data immediately (animate swap)
    await this.animateSwap(tileA, tileB);

    // Swap data grid and metadata
    this.swapData(tileA, tileB);

    // Check matches after swap
    const matches = this.findMatches();

    if (matches.length > 0) {
      // Match found, update score and resolve matches
      this.score += matches.length * 10;
      this.scoreText.setText(this.score.toString());
      await this.resolveMatches();
    } else {
      // No match, swap back visually & data
      await this.animateSwap(tileA, tileB);
      this.swapData(tileA, tileB);
    }
  }

  async animateSwap(
    tileA: Phaser.GameObjects.Image,
    tileB: Phaser.GameObjects.Image
  ) {
    const rowA = tileA.getData("row");
    const colA = tileA.getData("col");
    const rowB = tileB.getData("row");
    const colB = tileB.getData("col");

    await Promise.all([
      new Promise((resolve) => {
        this.tweens.add({
          targets: tileA,
          x: 140 + colB * (this.cellSize + this.gap),
          y: 800 + rowB * (this.cellSize + this.gap),
          duration: 200,
          ease: "Cubic.easeInOut",
          onComplete: resolve,
        });
      }),
      new Promise((resolve) => {
        this.tweens.add({
          targets: tileB,
          x: 140 + colA * (this.cellSize + this.gap),
          y: 800 + rowA * (this.cellSize + this.gap),
          duration: 200,
          ease: "Cubic.easeInOut",
          onComplete: resolve,
        });
      }),
    ]);
  }

  swapData(tileA: Phaser.GameObjects.Image, tileB: Phaser.GameObjects.Image) {
    const rowA = tileA.getData("row");
    const colA = tileA.getData("col");
    const rowB = tileB.getData("row");
    const colB = tileB.getData("col");

    // Swap grid references
    this.fruitGrid[rowA][colA] = tileB;
    this.fruitGrid[rowB][colB] = tileA;

    // Swap stored row/col metadata
    tileA.setData("row", rowB);
    tileA.setData("col", colB);
    tileB.setData("row", rowA);
    tileB.setData("col", colA);
  }
}
