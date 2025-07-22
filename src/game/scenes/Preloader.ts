import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    this.add
      .image(0, 0, "BG_LOADING")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);
  }

  preload() {
    //  Load the assets for the game - Replace with the path to your own assets
    this.load.image("BG_MENU", "assets/BG_MENU.png");
    this.load.image("BG_PLAY", "assets/BG_PLAY.png");
    this.load.image("BTN_PLAY", "assets/BTN_PLAY.png");
    this.load.image("COIN_BG", "assets/COIN_BG.png");
    this.load.image("TIME_BG", "assets/TIME_BG.png");
    this.load.image("POPUP_WIN", "assets/POPUP_WIN.png");
    this.load.image("BURGER", "assets/BURGER.png");
    this.load.image("DRINK", "assets/DRINK.png");
    this.load.image("EGGTART", "assets/EGGTART.png");
    this.load.image("MAKMAK", "assets/MAKMAK.png");
    this.load.image("MOONCAKE", "assets/MOONCAKE.png");
    this.load.image("BOARD", "assets/BOARD.png");
    this.load.image("TILE-BORDER", "assets/TILE-BORDER.png");
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, we will define our 'coin' animation here, so we can use it in other scenes:

    //  When all the assets are loaded go to the next scene.
    //  We can go there immediately via: this.scene.start('MainMenu');
    //  Or we could use a Scene transition to fade between the two scenes:
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("MainMenu");
    });

    //  When the transition completes, it will move automatically to the MainMenu scene
  }
}
