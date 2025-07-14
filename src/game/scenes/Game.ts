import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    this.add
      .image(0, 0, "BG_PLAY")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);
  }
}
