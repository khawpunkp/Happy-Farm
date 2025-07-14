import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    this.add
      .image(0, 0, "BG_MENU")
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight);
  }

  preload() {
    //  Load the assets for the game - Replace with the path to your own assets
    this.load.image("BG_PLAY", "assets/BG_PLAY.png");
    this.load.image("BTN_PLAY", "assets/BTN_PLAY.png");
    this.load.image("COIN_BG", "assets/COIN_BG.png");
    this.load.image("TIME_BG", "assets/TIME_BG.png");
    this.load.image("POPUP_WIN", "assets/POPUP_WIN.png");
    this.load.image("FRUIT1", "assets/FRUIT1.png");
    this.load.image("FRUIT1-ACTIVE", "assets/FRUIT1-ACTIVE.png");
    this.load.image("FRUIT2", "assets/FRUIT2.png");
    this.load.image("FRUIT2-ACTIVE", "assets/FRUIT2-ACTIVE.png");
    this.load.image("FRUIT3", "assets/FRUIT3.png");
    this.load.image("FRUIT3-ACTIVE", "assets/FRUIT3-ACTIVE.png");
    this.load.image("FRUIT4", "assets/FRUIT4.png");
    this.load.image("FRUIT4-ACTIVE", "assets/FRUIT4-ACTIVE.png");
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, we will define our 'coin' animation here, so we can use it in other scenes:

    //  When all the assets are loaded go to the next scene.
    //  We can go there immediately via: this.scene.start('MainMenu');
    //  Or we could use a Scene transition to fade between the two scenes:

    this.scene.start("MainMenu");

    //  When the transition completes, it will move automatically to the MainMenu scene
  }
}
