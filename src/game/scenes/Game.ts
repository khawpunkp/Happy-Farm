import { MainMenu } from "./MainMenu";
import { Scene } from "phaser";

export class Game extends Scene {
  scoreText: Phaser.GameObjects.Text;
  timeText: Phaser.GameObjects.Text;
  fruitGrid: (Phaser.GameObjects.Image | null)[][];
  startGridX: number;
  startGridY: number;
  rows: number;
  cols: number;
  cellSize: number;
  gap: number;
  fruits: string[];
  selectedTile: Phaser.GameObjects.Image | null = null;
  targetTile: Phaser.GameObjects.Image | null = null;
  startPosX: number;
  startPosY: number;
  score: number = 0;
  isBusy: boolean = false;
  timerEvent: Phaser.Time.TimerEvent | null = null;
  timeRemaining: number = 30; // seconds

  constructor() {
    super("Game");
    this.fruitGrid = [];
    this.rows = 7;
    this.cols = 5;
    this.gap = 5;
    this.fruits = ["APPLE", "BERRY", "CARROT", "PEAR"];
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    const gridWidth = gameWidth * 0.9;

    // Set a gap between tiles (or calculate dynamically)
    this.gap = 5; // or try 5 or 10

    // Calculate tile size to fit gridWidth with gaps
    this.cellSize = (gridWidth - (this.cols - 1) * this.gap) / this.cols;

    const totalGridWidth =
      this.cols * this.cellSize + (this.cols - 1) * this.gap;

    // Start X: center the grid horizontally
    this.startGridX = (gameWidth - totalGridWidth) / 2 + this.cellSize / 2;

    // Start Y: center grid vertically (or choose a fixed value)
    this.startGridY = 800;

    this.add
      .image(0, 0, "BG_PLAY")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);

    this.createUI(gameWidth);
    this.createFruitGrid(); // 🔥 now it actually creates the fruit grid
    this.startTimer();

    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.on("pointerup", () => {
      if (!this.isBusy) {
        this.tileUp();
      }
    });
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

  startTimer() {
    this.timeRemaining = 30;

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

  handlePointerMove(pointer: Phaser.Input.Pointer) {
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
        this.targetTile = this.fruitGrid[hoverCol][hoverRow];
        this.swapTiles();

        this.time.delayedCall(250, () => {
          this.checkMatch();
        });
      }
    }
  }

  createFruitGrid() {
    //Loop through each column in the grid
    for (let col = 0; col < this.cols; col++) {
      this.fruitGrid[col] = [];
      //Loop through each row in a column, starting from the top
      for (let row = 0; row < this.rows; row++) {
        //Add the tile to the game at this grid position
        const tile = this.addTile(col, row);

        //Keep a track of the tiles position in our tileGrid
        this.fruitGrid[col][row] = tile;
      }
    }

    // Check for initial matches after grid is created
    this.time.delayedCall(250, () => {
      this.checkMatch();
    });
  }

  getSafeRandomKey(col: number, row: number): string {
    const possible = [...this.fruits];

    // Check horizontal (left side)
    if (col >= 2) {
      const left1 = this.fruitGrid[col - 1][row];
      const left2 = this.fruitGrid[col - 2][row];
      if (left1 && left2 && left1.getData("key") === left2.getData("key")) {
        const banned = left1.getData("key");
        const index = possible.indexOf(banned);
        if (index !== -1) possible.splice(index, 1); // remove bad key
      }
    }

    // Check vertical (above)
    if (row >= 2) {
      const above1 = this.fruitGrid[col][row - 1];
      const above2 = this.fruitGrid[col][row - 2];
      if (above1 && above2 && above1.getData("key") === above2.getData("key")) {
        const banned = above1.getData("key");
        const index = possible.indexOf(banned);
        if (index !== -1) possible.splice(index, 1);
      }
    }

    // Pick a safe random key
    return Phaser.Utils.Array.GetRandom(possible);
  }

  addTile(col: number, row: number): Phaser.GameObjects.Image {
    // Choose a random fruit texture key
    const key = this.getSafeRandomKey(col, row);

    // Calculate position with cell size and gap
    const xPos = this.startGridX + col * (this.cellSize + this.gap);
    const yPos = this.startGridY + row * (this.cellSize + this.gap);
    const yStart = yPos - this.cellSize * 2; // spawn from top

    // Create tile image
    const tile = this.add.image(xPos, yStart, key);
    tile.setOrigin(0.5);
    tile
      .setDisplaySize(this.cellSize, this.cellSize) // Optional: ensure consistent size
      .setData({ row, col, key });

    // Animate tile falling into place
    this.tweens.add({
      targets: tile,
      y: yPos,
      duration: 200,
      ease: "Cubic.easeInOut",
    });

    // Enable input
    tile.setInteractive();
    tile.on("pointerdown", () => this.tileDown(tile));

    // Custom property to track type (you can define an interface if needed)

    return tile;
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

  swapTiles() {
    // Get original grid positions
    if (!this.selectedTile || !this.targetTile) return;
    const tile1Col = this.selectedTile.getData("col");
    const tile1Row = this.selectedTile.getData("row");
    const tile2Col = this.targetTile.getData("col");
    const tile2Row = this.targetTile.getData("row");

    // Swap tiles in fruitGrid array
    this.fruitGrid[tile1Col][tile1Row] = this.targetTile;
    this.fruitGrid[tile2Col][tile2Row] = this.selectedTile;

    // Update each tile's stored grid position
    this.selectedTile.setData({ col: tile2Col, row: tile2Row });
    this.targetTile.setData({ col: tile1Col, row: tile1Row });

    // Calculate pixel positions
    const getTilePosition = (col: number, row: number) => {
      const x = this.startGridX + col * (this.cellSize + this.gap);
      const y = this.startGridY + row * (this.cellSize + this.gap);
      return { x, y };
    };

    const pos1 = getTilePosition(tile2Col, tile2Row);
    const pos2 = getTilePosition(tile1Col, tile1Row);

    // Animate the swap using tweens
    this.tweens.add({
      targets: this.selectedTile,
      x: pos1.x,
      y: pos1.y,
      duration: 200,
      ease: "Linear",
    });

    this.tweens.add({
      targets: this.targetTile,
      x: pos2.x,
      y: pos2.y,
      duration: 200,
      ease: "Linear",
    });
  }

  async checkMatch() {
    const rawMatches = this.getMatches(this.fruitGrid);
    const matches = this.mergeOverlappingMatches(rawMatches);

    if (matches.length > 0) {
      // 1. Remove matched tiles
      await this.removeTileGroup(matches);

      // 2. Drop remaining tiles to fill gaps
      await this.dropTiles();

      // 3. Add new tiles at the top
      await this.fillTiles();

      // 4. After animations are done, reset selected state
      this.time.delayedCall(250, () => {
        this.tileUp();
      });

      // 5. Re-check for additional matches after everything settles
      this.time.delayedCall(250, () => {
        this.checkMatch();
      });

      if (!this.hasPossibleMoves()) {
        // Do reshuffle or reset here
        await this.reshuffle();
      }
    } else {
      // No match — reverse the swap visually
      this.swapTiles();

      // Reset state after swap back
      this.time.delayedCall(250, () => {
        this.tileUp();
        this.isBusy = false;
      });
    }
  }

  hasPossibleMoves(): boolean {
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        const currentTile = this.fruitGrid[col][row];

        if (!currentTile) continue;

        // Check swap with right neighbor
        if (col < this.cols - 1) {
          const rightTile = this.fruitGrid[col + 1][row];
          if (rightTile) {
            // Swap temporarily
            this.fruitGrid[col][row] = rightTile;
            this.fruitGrid[col + 1][row] = currentTile;

            const matches = this.getMatches(this.fruitGrid);

            // Swap back
            this.fruitGrid[col][row] = currentTile;
            this.fruitGrid[col + 1][row] = rightTile;

            if (matches.length > 0) return true;
          }
        }

        // Check swap with bottom neighbor
        if (row < this.rows - 1) {
          const bottomTile = this.fruitGrid[col][row + 1];
          if (bottomTile) {
            // Swap temporarily
            this.fruitGrid[col][row] = bottomTile;
            this.fruitGrid[col][row + 1] = currentTile;

            const matches = this.getMatches(this.fruitGrid);

            // Swap back
            this.fruitGrid[col][row] = currentTile;
            this.fruitGrid[col][row + 1] = bottomTile;

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
        const tile = this.fruitGrid[col][row];
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
        this.fruitGrid[col][row] = tile;
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
          duration: 300,
          ease: "Cubic.easeInOut",
        });

        index++;
      }
    }

    // 4. Wait for tween to finish
    await new Promise((resolve) => this.time.delayedCall(350, resolve));

    // 5. Check if any matches after reshuffle, if so reshuffle again
    if (this.getMatches(this.fruitGrid).length > 0) {
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

  async removeTileGroup(matches: Phaser.GameObjects.Image[][]): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const group of matches) {
      // 🔢 Score logic
      if (group.length >= 5) this.score += 100;
      else if (group.length === 4) this.score += 50;
      else if (group.length === 3) this.score += 30;

      // 🖥 Update UI
      this.scoreText.setText(this.score.toString());
      for (const tile of group) {
        const col = tile.getData("col");
        const row = tile.getData("row");
        const baseKey = tile.getData("key");

        // Change texture to "-ACTIVE" variant
        tile.setTexture(`${baseKey}-ACTIVE`);

        const promise = new Promise<void>((resolve) => {
          // Delay to show the active effect
          this.time.delayedCall(500, () => {
            // Animate fade out
            this.tweens.add({
              targets: tile,
              alpha: 0,
              duration: 150,
              onComplete: () => {
                tile.destroy();

                // Remove from grid
                if (
                  col >= 0 &&
                  col < this.cols &&
                  row >= 0 &&
                  row < this.rows &&
                  this.fruitGrid[col][row] === tile
                ) {
                  this.fruitGrid[col][row] = null;
                }

                resolve();
              },
            });
          });
        });

        promises.push(promise);
      }
    }

    // Wait for all removals to finish
    await Promise.all(promises);
  }

  async dropTiles(): Promise<void> {
    return new Promise((resolve) => {
      let animations = 0;
      let completed = 0;

      for (let col = 0; col < this.cols; col++) {
        for (let row = this.rows - 1; row > 0; row--) {
          if (
            this.fruitGrid[col][row] === null &&
            this.fruitGrid[col][row - 1] !== null
          ) {
            const tileAbove = this.fruitGrid[col][row - 1];
            this.fruitGrid[col][row] = tileAbove;
            this.fruitGrid[col][row - 1] = null;

            tileAbove?.setData("row", row);
            const y = this.startGridY + row * (this.cellSize + this.gap);

            animations++;
            this.tweens.add({
              targets: tileAbove,
              y: y,
              duration: 200,
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
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        if (this.fruitGrid[col][row] === null) {
          const newTile = this.addTile(col, row);
          this.fruitGrid[col][row] = newTile;
        }
      }
    }

    // Wait for tile drop animation duration, assuming 200ms here
    await new Promise((resolve) => this.time.delayedCall(250, resolve));
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
          fontFamily: "Prompt",
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
