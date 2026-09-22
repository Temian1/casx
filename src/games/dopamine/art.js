import zyn from "../../assets/dopamine/2.png";
import velo from "../../assets/dopamine/4.png";
import monster from "../../assets/dopamine/7.png";
import redbull from "../../assets/dopamine/8.png";
import iphone from "../../assets/dopamine/6.png";
import cash from "../../assets/dopamine/9.png";
import ferrari from "../../assets/dopamine/14.png";
import dom from "../../assets/dopamine/20.png";
import scatter from "../../assets/dopamine/23.png";

/* Supplied artwork from “Dopamine Bonanza by Rolls.gg.zip”, mapped to the
   matching symbol ids used by the game engine. */
export const SYMBOL_IMAGES = {
  zyn,
  velo,
  monster,
  redbull,
  iphone,
  cash,
  ferrari,
  dom,
  scatter,
};

export function symbolImage(id) {
  return SYMBOL_IMAGES[id] || "";
}
