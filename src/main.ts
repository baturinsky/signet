import { Card, freshCard } from "./Card";
import { Link } from "./Link";
import { canvas, canvasSize, render } from "./render";
import { BuildRandomSound, generateMusic, notes, NotesPlayer, SoundToArray, zz, ZZFXSound } from "./sound";
import { Star, StarProbabilities, starRGBs } from "./Star";
import { Team } from "./Team";
import { listMin, randomListElement, repeatEachFrame, rgbtoStyle, RNG, weightedRandomO } from "./utils";
import { dist, scale, Vec2, Vec3 } from "./v";

export const cardsPerHand = 5;

export const links: { [id: string]: Link } = {};
export const stars: Star[] = [];
export let us: Team, them: Team, teams: Team[] = [];
export let colorblindMode = false;

export let pointedStar: Star | null = null, mainStar: Star;
export let selectedCard: Card | null, hoveredCard: Card;

let galNum = 1;
export let bestMove: {
  card: Card | null;
  target: Star | null;
  added: number;
} = { added: 0 } as any;

export let rng = RNG(galNum);

export let theirTurn = false;

init();

repeatEachFrame(() => {
})

function init() {
  us = new Team("us");
  them = new Team("them");
  teams = [us, them]
  console.log(teams);

  rng = RNG(++galNum);

  stars.length = 0;
  for (let k in links)
    delete links[k];

  mainStar = new Star([0.5, 0.5], .02, "Green")

  for (let i = 0; i < 10000 && stars.length < 400; i++) {
    const pos = [0, 1].map(_ => (rng() + rng()) * .5) as Vec2;
    let bad = false;
    for (let s of stars) {
      if (dist(s.at, pos) < 0.02)
        bad = true;
    }
    if (!bad) {
      new Star(pos);
    }
  }

  for (let a of stars) {
    for (let b of stars) {
      let d = dist(a.at, b.at);
      if (a != b && d < .06 && rng() < .8)
        new Link(a, b, true);
    }
  }

  for (let a of stars) {
    if (a.links.length <= 2) {
      let neighbors = [...stars].sort((q, p) => dist(q.at, a.at) - dist(p.at, a.at)).filter(b => b.links.length >= 3 && !a.linkTo(b));
      for (let b of neighbors.slice(0, 10)) {
        new Link(a, b, true);
        if (a.links.length > 1 && rng() > .5)
          break;
      }
    }
  }

  /*let mainNbrs = mainStar.neighbors(3);
  console.log(mainNbrs);
  for (let n of mainNbrs) {
    n.highlight = true;
  }*/

  mainStar.neighbors(2).forEach(n => n.connected = them)
  mainStar.connected = us
  for (let t of teams) {
    t.score = stars.filter(s => s.connected == t).length
  }

  for (let i = 0; i < 5;) {
    let s = randomListElement(stars, rng);
    if (s.connected)
      continue;
    i++;
    //s.sound = new ZZFXSound(SoundToArray(generateMusic()))
    //s.sound = new ZZFXSound(SoundToArray(BuildRandomSound(undefined,undefined,undefined)))
  }

  freshCard.length = 0
  render()
}

export function pointerDown(e: PointerEvent) {
  console.log(pointedStar);



  if (theirTurn)
    return;

  if (pointedStar && selectedCard?.canBeUsedOn(pointedStar) && selectedCard.owner == us) {
    if (selectedCard.owner == us) {
      selectedCard.play(pointedStar);
      selectedCard = null
      theirTurn = true;
      bestMove = them.bestMove();
      render()
      freshCard.length = 0;
    }
  }
}

export function acceptTheirMove() {
  if (bestMove.target)
    bestMove.card?.play(bestMove.target);
  bestMove.card = null;
  bestMove.target = null;
  theirTurn = false; 
  render() 
  freshCard.length = 0;
}

export function pointerMove(e: PointerEvent) {
  let offset = [e.offsetX, e.offsetY] as Vec2;
  let pos = scale(offset, 1 / canvasSize)
  pointedStar = null;
  let nearest = listMin(stars, s => dist(s.at, pos))
  if (nearest.value < .015 && nearest.element && pointedStar != nearest.element) {
    if (pointedStar != nearest.element) {
      pointedStar = nearest.element;
      for (let s of stars) {
        if (s.sound) {
          let d = dist(s.at, pointedStar.at);
          s.sound.play(.2 / (1 + d));
        }
      }
    }
  }
  let tt = document.getElementById("tooltip");
  if (tt) {
    if (pointedStar) {
      let cr = canvas.getBoundingClientRect();
      let starScreenPos = [cr.left + pointedStar.at[0] * canvasSize, cr.top + pointedStar.at[1] * canvasSize];
      tt.style.display = "block";
      tt.innerHTML =
        `<div><span style="color:${rgbtoStyle(starRGBs[pointedStar.kind])}">${pointedStar.kind}</span> system</div>
      ${pointedStar.connected ? "Connected by " + (pointedStar.connected.name) : "Not connected"}
      `
        ;
      tt.style.left = `${starScreenPos[0] + 50}px`;
      tt.style.top = `${starScreenPos[1] - 15}`
      //tt.style.top = `${starScreenPos[1] > 100 ? starScreenPos[1] - 80 : starScreenPos[1] + 30}px`;
    } else {
      tt.style.display = "none"
    }
  }
  if(!theirTurn)
    render()
}

addEventListener("keydown", e => {
  if (e.code == "KeyN") {
    init()
  }
  if (e.code == "KeyC") {
    colorblindMode = !colorblindMode;
    render()
  }
})



function locateCardById(id: any) {
  if (id) {
    for (let team of teams) {
      let card = team.cards.find(c => c.id == Number(id))
      if (card) {
        return card;
      }
    }
  }
}

function selectCard(card?: Card) {
  if (!card)
    return;
  selectedCard = card;
}

document.addEventListener("pointerdown", e => {
  //for(let i of [0,1,2])    new ZZFXSound(BuildRandomSound()).play()
  if ((e.target as HTMLElement)?.id == "ok") {
    if (theirTurn)
      acceptTheirMove();
  }

  let card = locateCardById((e.target as HTMLElement)?.dataset.card);
  if (card?.owner != us)
    return;
  selectCard(card)
  render()
})

document.addEventListener("pointermove", e => {
  if (theirTurn)
    return
  let card = locateCardById((e.target as HTMLElement)?.dataset.card);
  if (card?.owner != us)
    return;
  if (card) {
    hoveredCard = card;
  }

})
