import { rng } from "./main";
import { render } from "./render";
import { same, Star, StarKind, StarProbabilities, StarProbabilitiesWithoutGreen } from "./Star";
import { Team } from "./Team";
import { randomListElement, weightedRandomO } from "./utils";

export type CardKind = "1away" | "2awaySameColor" | "distant";
export let freshCard: Card[] = [];

export function removeFreshCard(){
}

export const cardDescriptions = {
  "1away": "Connect all systems next to the connected COLOR system",
  "2awaySameColor": "Connect all COLOR systems in 1-2 jumps away from the connected COLOR system",
  "distant": "Connect one COLOR system in up to 3 jumps away from the connected COLOR system",
  "flood": "Connect a group of COLOR systems"
}

export const cardIcons = {
  "1away": "-*",
  "2awaySameColor": "-=-=",
  "distant": "---1",
  "flood": "=∞"
}

export const cardChances = {
  "1away": 1,
  "2awaySameColor": 1,
  "distant": .5,
  "flood": .5
}

let lastCardId = 0;

export function generateCard(owner: Team) {
  let card = new Card(owner);
  card.kind = weightedRandomO(cardChances, rng) as CardKind;
  card.starKind = weightedRandomO(StarProbabilitiesWithoutGreen, rng) as StarKind;
  return card;
}

export class Card {
  starKind: StarKind = "Green";
  kind: CardKind = "1away";

  public id = ++lastCardId;

  constructor(public owner: Team) {
    freshCard.push(this);
  }

  canBeUsedOn(star: Star | null) {
    if (!star || !same(star.kind, this.starKind))
      return false;
    if (this.kind == "distant") {
      if (star.connected)
        return false;
      let nb = star.neighbors(3).find(s => s.connected && same(s.kind, this.starKind));
      return nb != null;
    } else {
      return star.connected
    }
    return false;
  }


  wouldConnect(star: Star | null) {
    if(!star)
      return []
    let list: Star[] = []
    if (!this.canBeUsedOn(star))
      return [];
    if (this.kind == "distant") {
      list = [star];
    } else if (this.kind == "1away") {
      list = star.neighbors(1);
    } else if (this.kind == "2awaySameColor") {
      list = star.neighbors(2).filter(s => same(s.kind, this.starKind));
    } else if (this.kind == "flood") {
      list = star.neighbors(1e6, s => same(s.kind, this.starKind));
    }
    list = list.filter(s => !s.connected)
    return list;
  }

  play(star: Star) {
    let toConnect = this.wouldConnect(star);
    for (let s of toConnect) {
      if (s.connected)
        debugger;
      s.connected = this.owner;
      this.owner.score++;
    }

    this.owner.cards = this.owner.cards.filter(c => c != this)
    this.owner.drawCards();
    return;
  }
}
