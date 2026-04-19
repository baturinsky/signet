import { links } from "./main";
import { Star } from "./Star";
import { intersects } from "./utils";
import { angle2d, dist, mul, norm, sub } from "./v";


export class Link {
  a: Star;
  b: Star;
  constructor(a: Star, b: Star, addToList = false) {
    /** Stars ordered by id */
    if (a.id > b.id)
      [a, b] = [b, a];
    this.a = a;
    this.b = b;
    if (a == b)
      return;
    if (!links[this.code()] && addToList) {
      for (let l of Object.values(links)) {
        if (intersects(l.a.at, l.b.at, this.a.at, this.b.at))
          return;

        //if (this.connectsTo(l) && dist(this.vec(), l.vec()) < 0.1) return;
      }
      links[this.code()] = this;
      a.links.push(this);
      b.links.push(this);
      a.linkedStars.add(b);
      b.linkedStars.add(a);
    }

  }
  code() {
    return `${this.a.id}-${this.b.id}`;
  }

  connectsTo(l: Link) {
    return this.a == l.a || this.b == l.a || this.a == l.b || this.b == l.b;
  }

  vec() {
    return norm(sub(this.b.at, this.a.at));
  }

  has(s?: Star | null) {
    return this.a == s || this.b == s;
  }
}
