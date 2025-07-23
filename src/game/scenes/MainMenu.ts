import { Scene } from "phaser";
import { createButton, createModal } from "../utils";

export class MainMenu extends Scene {
  startButton: any;

  constructor() {
    super("MainMenu");
  }

  create() {
    //  Get the current highscore from the registry

    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    this.add
      .image(0, 0, "BG_Main")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);

    this.add.image(gameWidth / 2, 25 * 3, "Logo").setOrigin(0.5, 0);

    this.add
      .text(gameWidth / 2, 265 * 3, "คงเหลือ 1/1 สิทธิ์ต่อวัน", {
        fontSize: "45px",
        fontFamily: "Aktiv Grotesk Thai",
        color: "black",
        align: "center",
      })
      .setOrigin(0.5, 0);

    const ruleModal = createModal({
      scene: this,
      title: "กติกาการเล่น\nและการให้คะแนน",
      isRule: true,
    });

    this.startButton = createButton({
      scene: this,
      x: gameWidth / 2,
      y: 315 * (3 + 1 / 3),
      imageKey: "Primary",
      label: "เล่น",
    });

    this.startButton = createButton({
      scene: this,
      x: gameWidth / 2,
      y: 390 * (3 + 1 / 3),
      imageKey: "Secondary",
      label: "กติกาการเล่น",
      callback: () => {
        ruleModal.show();
      },
    });

    this.startButton = createButton({
      scene: this,
      x: gameWidth / 2,
      y: 465 * (3 + 1 / 3),
      imageKey: "Danger",
      label: "ออก",
      // callback: () => {
      //   this.cameras.main.fadeOut(500, 0, 0, 0);
      //   this.cameras.main.once("camerafadeoutcomplete", () => {
      //     this.scene.start("Loading");
      //   });
      // },
    });
  }
}
