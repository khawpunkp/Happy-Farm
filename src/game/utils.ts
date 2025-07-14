import { Scene, GameObjects, Types } from "phaser";

export function addPressEffect(
  btn: GameObjects.Image,
  normalScale: number,
  pressedScale: number
) {
  btn.on("pointerdown", () => {
    btn.setScale(pressedScale);
  });

  btn.on("pointerup", () => {
    btn.setScale(normalScale);
  });

  btn.on("pointerout", () => {
    btn.setScale(normalScale);
  });
}

interface ButtonOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  imageKey: string;
  label?: string;
  imageScale?: number;
  labelStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  pressedScale?: number;
  callback?: () => void;
}

export const createButtonWithImage = ({
  scene,
  x,
  y,
  imageKey,
  label = "",
  imageScale = 1,
  labelStyle = {},
  pressedScale,
  callback,
}: ButtonOptions) => {
  const btn = scene.add
    .image(x, y, imageKey)
    .setOrigin(0.5)
    .setScale(imageScale)
    .setInteractive({ useHandCursor: true });

  if (!!pressedScale) {
    addPressEffect(btn, imageScale, pressedScale);
  }

  if (label) {
    scene.add.text(x, y, label, labelStyle).setOrigin(0.5);
  }

  if (callback) {
    btn.on("pointerdown", callback);
  }

  return btn;
};
