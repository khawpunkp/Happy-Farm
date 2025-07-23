import { Scene } from "phaser";

export class Game extends Scene {
  scoreText: Phaser.GameObjects.Text;
  timeText: Phaser.GameObjects.Text;
  tileGrid: (Phaser.GameObjects.Image | null)[][];
  startGridX: number;
  startGridY: number;
  rows: number;
  cols: number;
  cellSize: number;
  gap: number;
  tileKey: string[];
  selectedTile: Phaser.GameObjects.Image | null = null;
  targetTile: Phaser.GameObjects.Image | null = null;

  startPosX: number;
  startPosY: number;
  score: number = 0;
  isBusy: boolean = false;
  timerEvent: Phaser.Time.TimerEvent | null = null;
  timeRemaining: number;
  lastSpawnedKey: string | null = null;

  scoreMultiplier: number;

  dropDuration: number;
  swapDuration: number;
  spawnDuration: number;
  destroyDuration: number;
  destroyDelay: number;
  shuffleDuration: number;

  constructor() {
    super("Game");
    this.tileGrid = [];
    this.rows = 8;
    this.cols = 6;
    this.gap = 10;
    this.tileKey = ["MOONCAKE", "EGGTART", "DRINK", "BURGER"];

    this.scoreMultiplier = 50;

    this.dropDuration = 200;
    this.swapDuration = 200;
    this.spawnDuration = 300;
    this.destroyDuration = 300;
    this.destroyDelay = 300;
    this.shuffleDuration = 300;
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    const gridWidth = gameWidth * 0.85;

    // Calculate tile size to fit gridWidth with gaps
    this.cellSize = (gridWidth - (this.cols - 1) * this.gap) / this.cols;

    const totalGridWidth =
      this.cols * this.cellSize + (this.cols - 1) * this.gap;

    // Start X: center the grid horizontally
    this.startGridX = (gameWidth - totalGridWidth) / 2 + this.cellSize / 2;

    // Start Y: center grid vertically (or choose a fixed value)
    this.startGridY = 540;

    this.add
      .image(0, 0, "BG_PLAY")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);

    this.createUI(gameWidth, gameHeight);
    this.createTileGrid(); // 🔥 now it actually creates the tile grid
    this.startTimer();

    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.on("pointerup", () => {
      if (!this.isBusy) {
        this.tileUp();
      }
    });
  }

  createUI(gameWidth: number, gameHeight: number) {
    //  // Coin background
    //  this.add
    //    .image(gameWidth - 280, 370, "COIN_BG")
    //    .setOrigin(0.5, 0.5)
    //    .setScale(1.2)
    //    .setAlpha(1);

    //  // Time background
    //  this.add
    //    .image(300, 370, "TIME_BG")
    //    .setOrigin(0.5, 0.5)
    //    .setScale(1.2)
    //    .setAlpha(1);

    this.add
      .image(gameWidth / 2, gameHeight / 2, "BOARD")
      .setDisplaySize(0.9 * gameWidth, 0.62 * gameHeight)
      .setOrigin(0.5, 0.5);

    // Score text
    this.scoreText = this.add
      .text(gameWidth - 200, 355, "0", {
        fontSize: "65px",
        fontFamily: "Aktiv Grotesk Thai",
      })
      .setOrigin(0.5, 0.5)
      .setStroke("#673606", 10);

    // Time text
    this.timeText = this.add
      .text(390, 355, "00:30", {
        fontSize: "65px",
        fontFamily: "Aktiv Grotesk Thai",
      })
      .setOrigin(0.5, 0.5)
      .setStroke("#673606", 10);
  }

  startTimer() {
    this.timeRemaining = 60;

    this.timerEvent = this.time.addEvent({
      delay: 1000, // 1 second
      callback: () => {
        this.timeRemaining--;

        // Format mm:ss for display
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const formatted = `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;

        this.timeText.setText(formatted);

        if (this.timeRemaining <= 0) {
          this.timerEvent?.remove(false);
          this.timeUp();
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  async handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isBusy || !this.selectedTile || this.targetTile) return;

    const hoverCol = Math.floor(
      (pointer.x - this.startGridX + this.cellSize / 2) /
        (this.cellSize + this.gap)
    );
    const hoverRow = Math.floor(
      (pointer.y - this.startGridY + this.cellSize / 2) /
        (this.cellSize + this.gap)
    );

    const difX = hoverCol - this.startPosX;
    const difY = hoverRow - this.startPosY;

    if (
      hoverCol >= 0 &&
      hoverCol < this.cols &&
      hoverRow >= 0 &&
      hoverRow < this.rows
    ) {
      const isAdjacent =
        (Math.abs(difX) === 1 && difY === 0) ||
        (Math.abs(difY) === 1 && difX === 0);

      if (isAdjacent) {
        this.isBusy = true;
        this.targetTile = this.tileGrid[hoverCol][hoverRow];
        await this.swapTiles();
        await this.checkMatch();
      }
    }
  }

  async createTileGrid() {
    let tileArray: { col: number; row: number }[] = [];

    //Loop through each column in the grid
    for (let col = 0; col < this.cols; col++) {
      this.tileGrid[col] = [];
      //Loop through each row in a column, starting from the top
      for (let row = 0; row < this.rows; row++) {
        tileArray.push({ col, row });
      }
    }

    this.time.delayedCall(250, async () => {
      await this.addTiles(tileArray);
      await this.checkMatch();
    });
  }

  getSafeRandomKey(col: number, row: number): string {
    const possible = [...this.tileKey];

    // Check horizontal (left side)
    if (col >= 2) {
      const left1 = this.tileGrid[col - 1][row];
      const left2 = this.tileGrid[col - 2][row];
      if (left1 && left2 && left1.getData("key") === left2.getData("key")) {
        const banned = left1.getData("key");
        const index = possible.indexOf(banned);
        if (index !== -1) possible.splice(index, 1); // remove bad key
      }
    }

    // Check vertical (above)
    if (row >= 2) {
      const above1 = this.tileGrid[col][row - 1];
      const above2 = this.tileGrid[col][row - 2];
      if (above1 && above2 && above1.getData("key") === above2.getData("key")) {
        const banned = above1.getData("key");
        const index = possible.indexOf(banned);
        if (index !== -1) possible.splice(index, 1);
      }
    }

    // Check last spawned key
    if (this.lastSpawnedKey) {
      const index = possible.indexOf(this.lastSpawnedKey);
      if (index !== -1 && possible.length > 1) {
        possible.splice(index, 1);
      }
    }

    const key = Phaser.Utils.Array.GetRandom(possible);

    // Update last spawned
    this.lastSpawnedKey = key;

    return key;
  }

  getTileX(col: number) {
    return this.startGridX + col * (this.cellSize + this.gap);
  }

  getTileY(row: number) {
    return this.startGridY + row * (this.cellSize + this.gap);
  }

  async addTiles(positions: { col: number; row: number }[]) {
    const tilePromises: Promise<void>[] = [];

    for (const { col, row } of positions) {
      const key = this.getSafeRandomKey(col, row);
      const xPos = this.getTileX(col);
      const yPos = this.getTileY(row);
      const yStart = yPos - this.cellSize * 1.1;

      const tile = this.add
        .image(xPos, yStart, key)
        .setOrigin(0.5)
        .setDisplaySize(this.cellSize, this.cellSize)
        .setData({ row, col, key });

      // Await tween to finish
      const promise = new Promise<void>((resolve) => {
        this.tweens.add({
          targets: tile,
          y: yPos,
          duration: this.dropDuration,
          ease: "Cubic.easeInOut",
          onComplete: () => {
            tile.setInteractive();
            tile.on("pointerdown", () => this.tileDown(tile));
            this.tileGrid[col][row] = tile;

            resolve();
          },
        });
      });

      tilePromises.push(promise);
    }

    await Promise.all(tilePromises);
  }

  tileDown(tile: Phaser.GameObjects.Image) {
    if (!this.isBusy) {
      this.selectedTile = tile;

      const col = tile.getData("col");
      const row = tile.getData("row");

      this.startPosX = col;
      this.startPosY = row;
    }
  }

  async swapTiles() {
    if (!this.selectedTile || !this.targetTile) return;

    const selectedCol = this.selectedTile.getData("col");
    const selectedRow = this.selectedTile.getData("row");
    const targetCol = this.targetTile.getData("col");
    const targetRow = this.targetTile.getData("row");

    // Swap in tileGrid
    this.tileGrid[selectedCol][selectedRow] = this.targetTile;
    this.tileGrid[targetCol][targetRow] = this.selectedTile;

    // Update tile data
    this.selectedTile.setData({ col: targetCol, row: targetRow });
    this.targetTile.setData({ col: selectedCol, row: selectedRow });

    // Pixel position helper
    const getTilePosition = (col: number, row: number) => {
      const x = this.startGridX + col * (this.cellSize + this.gap);
      const y = this.startGridY + row * (this.cellSize + this.gap);
      return { x, y };
    };

    const pos1 = getTilePosition(targetCol, targetRow);
    const pos2 = getTilePosition(selectedCol, selectedRow);

    // Create tween promises
    const tween1 = new Promise<void>((resolve) => {
      this.tweens.add({
        targets: this.selectedTile,
        x: pos1.x,
        y: pos1.y,
        duration: this.swapDuration,
        ease: "Linear",
        onComplete: () => resolve(),
      });
    });

    const tween2 = new Promise<void>((resolve) => {
      this.tweens.add({
        targets: this.targetTile,
        x: pos2.x,
        y: pos2.y,
        duration: this.swapDuration,
        ease: "Linear",
        onComplete: () => resolve(),
      });
    });

    // Wait for both tweens to complete
    await Promise.all([tween1, tween2]);
  }

  async destroyAllTilesWithKey(
    targetKey: string,
    makmak: Phaser.GameObjects.Image
  ): Promise<void> {
    const destroyPromises: Promise<void>[] = [];
    let tilesFound = 0;

    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        const tile = this.tileGrid[col][row];
        if (tile && tile.getData("key") === targetKey) {
          tilesFound++;

          const border = this.add
            .image(tile.x, tile.y, "TILE_BORDER")
            .setDepth(tile.depth + 1)
            .setDisplaySize(tile.displayWidth, tile.displayHeight);

          const promise = new Promise<void>((resolve) => {
            // Delay to show the active effect
            this.time.delayedCall(this.destroyDelay, () => {
              // Animate fade out
              this.tweens.add({
                targets: [tile, border],
                alpha: 0,
                duration: this.destroyDuration,
                onComplete: () => {
                  tile.destroy();
                  border.destroy();
                  this.tileGrid[col][row] = null;
                  resolve();
                },
              });
            });
          });

          destroyPromises.push(promise);
        }
      }
    }

    tilesFound++;

    const makmakCol = makmak.getData("col");
    const makmakRow = makmak.getData("row");

    const border = this.add
      .image(makmak.x, makmak.y, "TILE_BORDER")
      .setDepth(makmak.depth + 1)
      .setDisplaySize(makmak.displayWidth, makmak.displayHeight);

    const promise = new Promise<void>((resolve) => {
      // Delay to show the active effect
      this.time.delayedCall(this.destroyDelay, () => {
        // Animate fade out
        this.tweens.add({
          targets: [makmak, border],
          alpha: 0,
          duration: this.destroyDuration,
          onComplete: () => {
            makmak.destroy();
            border.destroy();
            this.tileGrid[makmakCol][makmakRow] = null;
            resolve();
          },
        });
      });
    });
    destroyPromises.push(promise);

    await Promise.all(destroyPromises);

    this.score += tilesFound * this.scoreMultiplier;
    this.scoreText.setText(this.score.toString());
  }

  async makmakMove(targetKey: string, makmak: Phaser.GameObjects.Image) {
    if (this.tileKey.includes(targetKey)) {
      // 1. Destroy tiles by key
      await this.destroyAllTilesWithKey(targetKey, makmak);

      // 2. Drop remaining tiles to fill gaps
      await this.dropTiles();

      // 3. Add new tiles at the top
      await this.fillTiles();

      // 4. After animations are done, reset selected state
      this.tileUp();

      // 5. Re-check for additional matches after everything settles
      this.time.delayedCall(200, async () => {
        await this.checkMatch();
      });

      if (!this.hasPossibleMoves()) {
        // Do reshuffle or reset here
        await this.reshuffle();
      }
    } else {
      await this.swapTiles();

      // Reset state after swap back
      this.tileUp();
      this.isBusy = false;
    }
  }

  async checkMatch() {
    this.isBusy = true;

    const rawMatches = this.getMatches(this.tileGrid);
    const matches = this.mergeOverlappingMatches(rawMatches);

    const selectedKey = this.selectedTile?.getData("key");
    const targetKey = this.targetTile?.getData("key");

    if (
      this.selectedTile &&
      selectedKey === "MAKMAK" &&
      targetKey !== "MAKMAK"
    ) {
      await this.makmakMove(targetKey, this.selectedTile);
    } else if (
      selectedKey !== "MAKMAK" &&
      this.targetTile &&
      targetKey === "MAKMAK"
    ) {
      await this.makmakMove(selectedKey, this.targetTile);
    } else if (matches.length > 0) {
      // 1. Remove matched tiles
      await this.removeTileGroup(matches);

      // 2. Drop remaining tiles to fill gaps
      await this.dropTiles();

      // 3. Add new tiles at the top
      await this.fillTiles();

      this.tileUp();

      this.time.delayedCall(200, async () => {
        await this.checkMatch();
      });

      if (!this.hasPossibleMoves()) {
        // Do reshuffle or reset here
        await this.reshuffle();
      }
    } else {
      // No match — reverse the swap visually
      await this.swapTiles();

      // Reset state after swap back
      this.tileUp();
      this.isBusy = false;
    }
  }

  hasPossibleMoves(): boolean {
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        const currentTile = this.tileGrid[col][row];

        if (!currentTile) continue;

        // Check swap with right neighbor
        if (col < this.cols - 1) {
          const rightTile = this.tileGrid[col + 1][row];
          if (rightTile) {
            // Swap temporarily
            this.tileGrid[col][row] = rightTile;
            this.tileGrid[col + 1][row] = currentTile;

            const matches = this.getMatches(this.tileGrid);

            // Swap back
            this.tileGrid[col][row] = currentTile;
            this.tileGrid[col + 1][row] = rightTile;

            if (matches.length > 0) return true;
          }
        }

        // Check swap with bottom neighbor
        if (row < this.rows - 1) {
          const bottomTile = this.tileGrid[col][row + 1];
          if (bottomTile) {
            // Swap temporarily
            this.tileGrid[col][row] = bottomTile;
            this.tileGrid[col][row + 1] = currentTile;

            const matches = this.getMatches(this.tileGrid);

            // Swap back
            this.tileGrid[col][row] = currentTile;
            this.tileGrid[col][row + 1] = bottomTile;

            if (matches.length > 0) return true;
          }
        }
      }
    }

    // No possible moves found
    return false;
  }

  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async reshuffle() {
    // 1. Gather all tiles (non-null)
    const tiles: Phaser.GameObjects.Image[] = [];
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        const tile = this.tileGrid[col][row];
        if (tile) tiles.push(tile);
      }
    }

    // 2. Shuffle the tiles array
    this.shuffleArray(tiles);

    // 3. Reassign shuffled tiles back to grid and update positions/data
    let index = 0;
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        const tile = tiles[index];
        this.tileGrid[col][row] = tile;
        tile.setData("col", col);
        tile.setData("row", row);

        // Calculate new position
        const x = this.startGridX + col * (this.cellSize + this.gap);
        const y = this.startGridY + row * (this.cellSize + this.gap);

        // Tween tile to new position
        this.tweens.add({
          targets: tile,
          x: x,
          y: y,
          duration: this.shuffleDuration,
          ease: "Cubic.easeInOut",
        });

        index++;
      }
    }

    // 4. Wait for tween to finish
    await new Promise((resolve) => this.time.delayedCall(350, resolve));

    // 5. Check if any matches after reshuffle, if so reshuffle again
    if (this.getMatches(this.tileGrid).length > 0) {
      await this.reshuffle();
    }
  }

  tileUp() {
    this.selectedTile = null;
    this.targetTile = null;
  }

  getMatches(
    tileGrid: (Phaser.GameObjects.Image | null)[][]
  ): Phaser.GameObjects.Image[][] {
    const matches: Phaser.GameObjects.Image[][] = [];

    const cols = tileGrid.length;
    const rows = tileGrid[0].length;

    // 🔁 Horizontal matches
    for (let row = 0; row < rows; row++) {
      let group: Phaser.GameObjects.Image[] = [];

      for (let col = 0; col < cols; col++) {
        const current = tileGrid[col][row];
        const prev1 = col > 0 ? tileGrid[col - 1][row] : null;
        const prev2 = col > 1 ? tileGrid[col - 2][row] : null;

        if (
          current &&
          prev1 &&
          prev2 &&
          current.getData("key") !== "MAKMAK" &&
          current.getData("key") === prev1.getData("key") &&
          current.getData("key") === prev2.getData("key")
        ) {
          // Start collecting group
          if (!group.includes(prev2)) group.push(prev2);
          if (!group.includes(prev1)) group.push(prev1);
          if (!group.includes(current)) group.push(current);
        } else if (group.length >= 3) {
          matches.push(group);
          group = [];
        } else {
          group = [];
        }
      }

      if (group.length >= 3) matches.push(group);
    }

    // 🔁 Vertical matches
    for (let col = 0; col < cols; col++) {
      let group: Phaser.GameObjects.Image[] = [];

      for (let row = 0; row < rows; row++) {
        const current = tileGrid[col][row];
        const prev1 = row > 0 ? tileGrid[col][row - 1] : null;
        const prev2 = row > 1 ? tileGrid[col][row - 2] : null;

        if (
          current &&
          prev1 &&
          prev2 &&
          current.getData("key") !== "MAKMAK" &&
          current.getData("key") === prev1.getData("key") &&
          current.getData("key") === prev2.getData("key")
        ) {
          if (!group.includes(prev2)) group.push(prev2);
          if (!group.includes(prev1)) group.push(prev1);
          if (!group.includes(current)) group.push(current);
        } else if (group.length >= 3) {
          matches.push(group);
          group = [];
        } else {
          group = [];
        }
      }

      if (group.length >= 3) matches.push(group);
    }

    return matches;
  }

  mergeOverlappingMatches(groups: Phaser.GameObjects.Image[][]) {
    const merged: Phaser.GameObjects.Image[][] = [];

    for (const group of groups) {
      let mergedIntoExisting = false;

      for (const existing of merged) {
        // Check if they share any tile
        if (group.some((tile) => existing.includes(tile))) {
          // Merge and deduplicate
          for (const tile of group) {
            if (!existing.includes(tile)) {
              existing.push(tile);
            }
          }
          mergedIntoExisting = true;
          break;
        }
      }

      if (!mergedIntoExisting) {
        merged.push([...group]);
      }
    }

    return merged;
  }

  async spawnMakmakTile(col: number, row: number) {
    // Create tile image
    const xPos = this.getTileX(col);
    const yPos = this.getTileY(row);

    const tile = this.add
      .image(xPos, yPos, "MAKMAK")
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0) // Start at scale 0
      .setData({ row, col, key: "MAKMAK" });

    // Force it to visually match the tile size regardless of original image size
    tile.setDisplaySize(this.cellSize, this.cellSize);

    // Store original displaySize so scale = 1 means "cellSize"
    const originalScaleX = tile.scaleX;
    const originalScaleY = tile.scaleY;

    // Reset to 0 to animate from nothing
    tile.setScale(0);

    this.tileGrid[col][row] = tile;

    // Enable input
    tile.setInteractive();
    tile.on("pointerdown", () => this.tileDown(tile));

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: tile,
        alpha: 1,
        scaleX: originalScaleX,
        scaleY: originalScaleY,
        ease: "Back.Out",
        duration: this.spawnDuration,
        onComplete: () => resolve(),
      });
    });
  }

  getTileWithMaxConnections(
    group: Phaser.GameObjects.Image[]
  ): Phaser.GameObjects.Image {
    let bestTile = group[0];
    let maxConnections = -1;

    for (const tile of group) {
      const col = tile.getData("col");
      const row = tile.getData("row");
      let connections = 0;

      for (const neighbor of group) {
        if (neighbor === tile) continue;
        const nCol = neighbor.getData("col");
        const nRow = neighbor.getData("row");

        const isAdjacent =
          (Math.abs(nCol - col) === 1 && nRow === row) || // Horizontal
          (Math.abs(nRow - row) === 1 && nCol === col); // Vertical

        if (isAdjacent) {
          connections++;
        }
      }

      if (connections > maxConnections) {
        maxConnections = connections;
        bestTile = tile;
      }
    }
    return bestTile;
  }

  async removeTileGroup(matches: Phaser.GameObjects.Image[][]): Promise<void> {
    const promises: Promise<void>[] = [];
    let tilesMatches = 0;

    for (const group of matches) {
      const groupPromises: Promise<void>[] = [];
      tilesMatches += group.length;

      const spawnTile =
        this.selectedTile?.getData("key") === group[0].getData("key")
          ? this.selectedTile
          : this.targetTile;

      let spawnMakmakFlag = false;
      let spawnCol = 0;
      let spawnRow = 0;

      if (group.length >= 5) {
        const centerTile = this.getTileWithMaxConnections(group);
        const centerCol = centerTile.getData("col");
        const centerRow = centerTile.getData("row");

        spawnCol = spawnTile ? spawnTile.getData("col") : centerCol;
        spawnRow = spawnTile ? spawnTile.getData("row") : centerRow;

        spawnMakmakFlag = true;
      }

      for (const tile of group) {
        const col = tile.getData("col");
        const row = tile.getData("row");

        const border = this.add
          .image(tile.x, tile.y, "TILE_BORDER")
          .setDepth(tile.depth + 1)
          .setDisplaySize(tile.displayWidth, tile.displayHeight);

        const promise = new Promise<void>((resolve) => {
          this.time.delayedCall(this.destroyDelay, () => {
            this.tweens.add({
              targets: [tile, border],
              alpha: 0,
              duration: this.destroyDuration,
              onComplete: () => {
                tile.destroy();
                border.destroy();
                this.tileGrid[col][row] = null;
                resolve();
              },
            });
          });
        });

        groupPromises.push(promise);
      }

      // After group is destroyed, spawn makmak
      const groupPromise = Promise.all(groupPromises).then(async () => {
        if (spawnMakmakFlag) {
          await this.spawnMakmakTile(spawnCol, spawnRow);
        }
      });

      promises.push(groupPromise);
    }

    // Wait for all removals to finish
    await Promise.all(promises);

    this.score += tilesMatches * this.scoreMultiplier;
    this.scoreText.setText(this.score.toString());
  }

  async dropTiles(): Promise<void> {
    return new Promise((resolve) => {
      let animations = 0;
      let completed = 0;

      for (let col = 0; col < this.cols; col++) {
        for (let row = this.rows - 1; row > 0; row--) {
          if (
            this.tileGrid[col][row] === null &&
            this.tileGrid[col][row - 1] !== null
          ) {
            const tileAbove = this.tileGrid[col][row - 1];
            this.tileGrid[col][row] = tileAbove;
            this.tileGrid[col][row - 1] = null;

            tileAbove?.setData("row", row);
            const y = this.startGridY + row * (this.cellSize + this.gap);

            animations++;
            this.tweens.add({
              targets: tileAbove,
              y: y,
              duration: this.dropDuration,
              ease: "Linear",
              onComplete: () => {
                completed++;
                if (completed === animations) resolve();
              },
            });

            row = this.rows;
          }
        }
      }

      // If no animations were triggered
      if (animations === 0) resolve();
    });
  }

  async fillTiles() {
    let tileArray: { col: number; row: number }[] = [];

    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        if (this.tileGrid[col][row] === null) {
          tileArray.push({ col, row });
        }
      }
    }

    await this.addTiles(tileArray);
  }

  timeUp() {
    this.isBusy = true;
    this.endGame();
  }

  endGame() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    // 🔲 Dark backdrop
    const backdrop = this.add
      .rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000)
      .setAlpha(0.5)
      .setDepth(500)
      .setInteractive(); // Make it clickable

    // 🧩 Popup
    const popup = this.add
      .image(gameWidth / 2, gameHeight / 2, "POPUP_WIN")
      .setOrigin(0.5)
      .setScale(1.7)
      .setDepth(1000)
      .setAlpha(1)
      .setInteractive(); // Also clickable

    // 📝 Score text
    this.add
      .text(
        gameWidth / 2 + 50,
        gameHeight / 2 + 170,
        `คุณได้รับ\n${this.score} คะแนน`,
        {
          fontSize: "55px",
          fontFamily: "Aktiv Grotesk Thai",
          align: "center",
        }
      )
      .setOrigin(0.5)
      .setDepth(1000);

    // 🎯 Go back to MainMenu when clicked anywhere on popup or backdrop
    this.time.delayedCall(3000, () => {
      const goToMenu = () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("MainMenu");
        });
      };

      backdrop.once("pointerup", goToMenu);
      popup.once("pointerup", goToMenu);
    });
  }
}
