import { Scene } from "phaser";

export class Loading extends Scene {
  constructor() {
    super("Loading");
  }

  init() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    this.add
      .image(0, 0, "BG_LOADING")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);
  }

  create() {
    this.time.delayedCall(500, async () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Game");
      });
    });
  }
}
