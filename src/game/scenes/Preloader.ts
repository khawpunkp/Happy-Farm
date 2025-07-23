import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    this.add
      .image(0, 0, "BG_Loading")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);
  }

  preload() {
    // BG
    this.load.image("BG_Main", "assets/images/background/Main.png");

    // Gameplay
    this.load.image("Board", "assets/images/gameplay/Board.png");
    this.load.image("Burger", "assets/images/gameplay/Burger.png");
    this.load.image("Drink", "assets/images/gameplay/Drink.png");
    this.load.image("Eggtart", "assets/images/gameplay/Eggtart.png");
    this.load.image("Makmak", "assets/images/gameplay/Makmak.png");
    this.load.image("Mooncake", "assets/images/gameplay/Mooncake.png");
    this.load.image("TileBorder", "assets/images/gameplay/TileBorder.png");

    //  UI
    this.load.image("Logo", "assets/images/ui/Logo.png");
    this.load.image("Modal", "assets/images/ui/Modal.png");
    this.load.image("RuleModal", "assets/images/ui/Rule-Modal.png");
    this.load.image("Primary", "assets/images/ui/button/Primary.png");
    this.load.image("Secondary", "assets/images/ui/button/Secondary.png");
    this.load.image("Danger", "assets/images/ui/button/Danger.png");
    this.load.image("Disable", "assets/images/ui/button/Disable.png");
  }

  create() {
    this.time.delayedCall(250, async () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MainMenu");
      });
    });
  }
}
