import { Card, generateCard } from "./Card";
import { cardsPerHand, stars } from "./main";
import { Star, TeamName } from "./Star";


export class Team {
  score = 0;
  cards: Card[] = [];

  constructor(public name: TeamName) {
    this.drawCards();
  }

  drawCards() {
    while (this.cards.length < cardsPerHand) {
      let card = generateCard(this);
      let sameColor = this.cards.filter(c => c.starKind == card.starKind)
      let sameKind = this.cards.filter(c => c.kind == card.kind)
      let same = this.cards.filter(c => c.kind == card.kind && c.starKind == card.starKind)
      if (sameKind.length >= 2 || sameColor.length >= 2 || same.length >= 1)
        continue
      this.cards.push(card);
    }
  }

  bestMove() {
    let best: { card: Card, target: Star, added: number, captures:Star[] } = { added: 0 } as any;
    for (let c of this.cards) {
      for (let s of stars) {
        let wc = c.wouldConnect(s);
        if (wc.length > best.added) {
          best.added = wc.length;
          best.card = c;
          best.target = s;
          best.captures = wc;
        }
      }
    }
    return best
  }
}
