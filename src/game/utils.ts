export function addPressEffect({
  btn,
  imageScale,
  pressedScale,
  text,
}: {
  btn: Phaser.GameObjects.Image;
  imageScale: number;
  pressedScale: number;
  text?: Phaser.GameObjects.Text;
}) {
  const calPressedScale = pressedScale * imageScale;
  const scaleRatio = calPressedScale / imageScale;
  const originalTextScaleX = text?.scaleX ?? 1;
  const originalTextScaleY = text?.scaleY ?? 1;

  btn.on("pointerdown", () => {
    btn.setScale(calPressedScale);
    if (text)
      text.setScale(
        originalTextScaleX * scaleRatio,
        originalTextScaleY * scaleRatio
      );
  });

  const reset = () => {
    btn.setScale(imageScale);
    if (text) text.setScale(originalTextScaleX, originalTextScaleY);
  };

  btn.on("pointerup", reset);
  btn.on("pointerout", reset);
}

interface ButtonOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  imageKey: string;
  depth?: number;
  label?: string;
  size?: "default" | "small";
  pressedScale?: number;
  callback?: () => void;
  disabled?: boolean;
}

export const createButton = ({
  scene,
  x,
  y,
  imageKey,
  depth = 100,
  pressedScale = 1.05,
  label = "",
  size = "default",
  callback,
  disabled,
}: ButtonOptions) => {
  const imageScale = size === "default" ? 1 : 0.88;
  const labelStyle: Phaser.Types.GameObjects.Text.TextStyle =
    size === "default"
      ? {
          fontSize: "55px",
          fontFamily: "Aktiv Grotesk Thai",
          fontStyle: "bold",
          shadow: {
            offsetX: 0,
            offsetY: 8,
            color: "#00000080",
            blur: 12,
            stroke: false,
            fill: true,
          },
        }
      : {
          fontSize: "50px",
          fontFamily: "Aktiv Grotesk Thai",
          fontStyle: "bold",
          shadow: {
            offsetX: 0,
            offsetY: 8,
            color: "#00000080",
            blur: 12,
            stroke: false,
            fill: true,
          },
        };

  const btn = scene.add
    .image(x, y, disabled ? "Disable" : imageKey)
    .setOrigin(0.5)
    .setScale(imageScale)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth);

  const text = scene.add
    .text(x, y - 15, label, labelStyle)
    .setOrigin(0.5)
    .setDepth(depth + 100);

  if (!!pressedScale && !disabled) {
    addPressEffect({ btn, imageScale, pressedScale, text });
  }

  if (callback && !disabled) {
    btn.on("pointerdown", callback);
  }

  return { btn, text };
};

interface ModalOptions {
  scene: Phaser.Scene;
  title: string;
  isRule?: boolean;
}
export const createModal = ({ scene, title, isRule }: ModalOptions) => {
  const gameWidth = scene.cameras.main.width;
  const gameHeight = scene.cameras.main.height;

  const backdrop = scene.add
    .rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000)
    .setAlpha(0)
    .setDepth(500)
    .setInteractive();

  const popup = scene.add
    .image(gameWidth / 2, gameHeight / 2, isRule ? "RuleModal" : "Modal")
    .setOrigin(0.5)
    .setDepth(1000)
    .setAlpha(0);

  // Hide modal with fade out
  const hide = () => {
    scene.time.delayedCall(100, async () => {
      scene.tweens.add({
        targets: [backdrop, popup, titleText, closeBtn, closeText],
        alpha: 0,
        duration: 500,
        ease: "Power2",
      });
    });
  };

  const titleContainer = scene.add
    .container(gameWidth / 2, gameHeight / 2 - popup.displayHeight / 2 + 105)
    .setDepth(2000);

  const titleText = scene.add
    .text(0, 0, title, {
      fontFamily: "Aktiv Grotesk Thai",
      fontSize: "60px",
      color: "#ffffff",
      stroke: "#ff7f00",
      strokeThickness: 12,
      align: "center",
      fontStyle: "bold",
      shadow: {
        offsetX: 0,
        offsetY: 8,
        color: "#00000080",
        blur: 12,
        stroke: false,
        fill: true,
      },
    })
    .setOrigin(0.5)
    .setDepth(2000)
    .setAlpha(0);

  titleContainer.add([titleText]);

  //   const debugContainer = scene.add
  //     .container(gameWidth / 2, gameHeight / 2 + 80)
  //     .setDepth(9999); // position slightly above popup top

  //   // Red border rectangle (width same as popup, height 40)
  //   const debugRect = scene.add
  //     .rectangle(0, 0, 780, 420)
  //     .setStrokeStyle(2, 0xff0000) // red border, 2px thickness
  //     .setFillStyle(0x000000, 0)
  //     .setDepth(9999);

  //   debugContainer.add([debugRect]);

  const { btn: closeBtn, text: closeText } = createButton({
    scene,
    x: gameWidth / 2,
    y: gameHeight / 2 + popup.displayHeight / 2,
    imageKey: "Danger",
    size: "small",
    label: "ปิด",
    depth: 2000,
    callback: hide,
  });

  closeBtn.setY(closeBtn.y - closeBtn.displayHeight / 2).setAlpha(0);
  closeText.setY(closeText.y - closeBtn.displayHeight / 2).setAlpha(0);

  const show = () => {
    scene.tweens.add({
      targets: backdrop,
      alpha: 0.7,
      duration: 500,
      ease: "Power2",
    });

    scene.tweens.add({
      targets: [popup, titleText, closeBtn, closeText],
      alpha: 1,
      duration: 500,
      ease: "Power2",
    });
  };

  return { show, hide, backdrop, popup };
};
