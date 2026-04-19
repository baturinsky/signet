import { Link } from "./Link";
import { rng, stars } from "./main";
import { ctx } from "./render";
import { ZZFXSound } from "./sound";
import { Team } from "./Team";
import { rgbtoStyle, weightedRandomO } from "./utils";
import { Vec2, Vec3 } from "./v";


export type StarKind = "Red" | "Yellow" | "Blue" | "White" | "Green";

/** compare colors, Green matches all */
export function same(color1: StarKind, color2: StarKind) {
  if (color1 == "Green" || color2 == "Green")
    return true;
  else
    return color1 == color2;
}

export const starRGBs = {
  Red: [255, 0, 0],
  Yellow: [255, 200, 0],
  Blue: [0, 0, 255],
  White: [100, 100, 100],
  Green: [0, 255, 0]
} as { [id: string]: Vec3 }

export const StarProbabilities = {
  Red: 1,
  Yellow: 1.5,
  Blue: 0.7,
  White: 0.4,
  Green: 0.2
}

export const StarProbabilitiesWithoutGreen = {...StarProbabilities, Green:0}

export type TeamName = "us" | "them";

export class Star {
  size: number;
  kind = "Yellow" as StarKind;
  rgb: [number, number, number];
  fillStyle: CanvasGradient;
  id = 0;
  links: Link[] = [];
  linkedStars = new Set<Star>();
  highlighted = false
  connected = null as Team | null;
  sound: ZZFXSound | null = null;

  linkTo(s: Star) {
    if (s == this)
      return;
    return this.links.find(l => l.a == s || l.b == s);
  }

  constructor(public at: Vec2, size?: number, kind?: StarKind) {
    this.size = size ?? (rng() * .5 + .5) * .008;

    this.kind = kind ?? weightedRandomO(StarProbabilities, rng) as StarKind;

    this.rgb = starRGBs[this.kind].map(v => v * (rng() * .2 + .8)) as Vec3;

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);

    // Add three color stops
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(.2, "#fff");
    gradient.addColorStop(.25, rgbtoStyle(this.rgb));
    gradient.addColorStop(.6, rgbtoStyle(this.rgb, .3));
    gradient.addColorStop(1, rgbtoStyle(this.rgb, 0));
    this.fillStyle = gradient;

    this.id = stars.length;

    stars.push(this);

  }

  neighborsDistances(maxDist = 1e6, passable = (s: Star) => true) {
    let front: Star[] = [this], distances = { [this.id]: 0 };
    while (front.length > 0) {
      let s = front.shift() as Star;
      let ndist = distances[s.id] + 1;
      if (ndist <= maxDist) {
        for (let nb of s.linkedStars) {
          if (!passable(nb))
            continue;
          if (!distances[nb.id] || distances[nb.id] > ndist) {
            distances[nb.id] = ndist;
            front.push(nb);
          }
        }
      }
    }
    delete distances[this.id];
    return distances;
  }

  neighbors(maxDist = 1e6, passable = (s: Star) => true) {
    return Object.keys(this.neighborsDistances(maxDist, passable)).map(k => stars[Number(k)])
  }
}

