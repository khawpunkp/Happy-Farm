import { GameObjects, Scene } from "phaser";
import { createButtonWithImage } from "../utils";

export class MainMenu extends Scene {
  startButton: GameObjects.Image;

  constructor() {
    super("MainMenu");
  }

  create() {
    //  Get the current highscore from the registry

    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    this.add
      .image(0, 0, "BG_MENU")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);

    this.add
      .text(gameWidth / 2, 850, "คงเหลือ 1/1 สิทธิ์ต่อวัน", {
        fontSize: "45px",
        fontFamily: "Arial", // หรือฟอนต์อื่นที่รองรับภาษาไทย
        color: "black", // สีข้อความ
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.startButton = createButtonWithImage({
      scene: this,
      x: gameWidth / 2,
      y: gameHeight / 2,
      imageKey: "BTN_PLAY",
      label: "",
      imageScale: 1.6,
      labelStyle: {},
      pressedScale: 1.5,
      callback: () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("Game");
        });
      },
    });
  }
}
