import { cardDescriptions, cardIcons, freshCard, removeFreshCard } from "./Card";
import { bestMove, colorblindMode, theirTurn, links, pointedStar, pointerDown, pointerMove, selectedCard, stars, teams, them, us, rng } from "./main";
import { starRGBs } from "./Star";
import { drawCircle, rgbtoStyle, RNG } from "./utils";

export let canvasSize = 0;

export const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

export function generateBackground() {
  let rng = RNG(10);
  let c = document.createElement("canvas")
  c.width = c.height = 1000;
  let ctx = c.getContext("2d") as CanvasRenderingContext2D;

  ctx.scale(c.width, c.height);
  for (let i = 0; i < 500; i++) {
    let r = rng() * .2;
    let center = [rng() * .6 + .2, rng() * .6 + .2]
    const gradient = ctx.createRadialGradient(center[0], center[1], 0, center[0], center[1], r);

    // Add three color stops
    gradient.addColorStop(0, `rgba(${rng() * 50},${rng() * 50},${rng() * 50 + 20},1)`);
    gradient.addColorStop(1, "#0000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 1);
  }
  return c;
}

const bg = generateBackground();

export function render() {
  for (let i of [0, 1]) {
    let team = teams[i];
    let div = document.getElementById("team" + i)
    if (!div)
      continue;
    let playingTeam = theirTurn == (team == them);
    div.classList.remove("playing")
    if (playingTeam)
      div.classList.add("playing")
    //div.style.borderColor = playingTeam?"#000":"#fff"
    div.innerHTML =
      `<div class="team-head" style="border-color:${playingTeam ? "#fff" : "#000"}">
      <h4 style="color:${team == us ? "#0a0" : "#f0f"}">${team == us ? "Us" : "Them"}</h4>
      Score: ${team.score}
      </div> <div class="team-cards">` +
      team.cards.map(card => {
        let desc: string = cardDescriptions[card.kind];
        let colorStyle = rgbtoStyle(starRGBs[card.starKind]);
        let colorText = `<span class="color" style="color:${colorStyle}">${card.starKind}</span>`
        desc = desc.replaceAll("COLOR", colorText)

        return `<div style="border-color:${colorStyle}" class="card ${freshCard.includes(card) ? "fresh" : ""} 
        ${card == selectedCard || card == bestMove.card ? "current" : ""}" data-card="${card.id}">
      <h4 style="color:${colorStyle}">${cardIcons[card.kind]}</h4>
        ${desc}
      </div>`
      }).join(' ')
      + (team == them && theirTurn ? "<button id='ok'>Accept opponent move</button>" : "")
      + "</div>"
  }

  /** Canvas size */
  canvasSize = canvas.clientWidth;
  if (canvas.width != canvasSize) {
    canvas.width = canvas.height = canvasSize;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);


  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff8";
  ctx.lineWidth = 0.001;

  ctx.save();

  ctx.scale(canvasSize, canvasSize);
  ctx.drawImage(bg, 0, 0, 1, 1);

  ctx.strokeStyle = "#fff8";
  //ctx.setLineDash([.003,.001])
  for (let l of Object.values(links)) {
    let thick = l.has(pointedStar) && false;
    ctx.lineWidth = thick ? 0.002 : 0.001;
    ctx.strokeStyle = thick ? "#fff" : "#fff8";
    ctx.beginPath();
    ctx.moveTo(...l.a.at);
    ctx.lineTo(...l.b.at);
    ctx.stroke();
  }

  let wc = pointedStar ? selectedCard?.wouldConnect(pointedStar) : null;

  if (theirTurn) {
    wc = bestMove.card?.wouldConnect(bestMove.target);
  }

  for (let s of stars) {

    ctx.fillStyle = s.fillStyle;
    ctx.translate(s.at[0], s.at[1]);
    drawCircle(ctx, [0, 0], s.size);

    ctx.textAlign = "center"

    if (pointedStar == s) {
      drawCircleHere("#fff", 0.01)
    }

    if (bestMove?.target == s) {
      ctx.save()
      ctx.strokeStyle = "#f0f";
      ctx.lineWidth = 0.003
      ctx.beginPath();
      ctx.moveTo(0.01, 0);
      ctx.lineTo(0.1, 0);
      ctx.moveTo(0.01, 0);
      ctx.lineTo(0.02, 0.01);
      ctx.moveTo(0.01, 0);
      ctx.lineTo(0.02, -0.01);
      ctx.stroke();
      ctx.restore()
    }

    if (s.connected) {
      let color = s.connected == us ? "#bfb" : "#fbf";
      drawCircleHere(color, 0.008, true)
    }

    if (s.sound) {
      drawCircleHere("#f00", 0.02)
    }

    if (selectedCard?.canBeUsedOn(s) /*&& (!pointedStar || !selectedCard?.canBeUsedOn(pointedStar))*/) {
      let n = selectedCard.wouldConnect(s).length;
      //drawCircleHere("#fff", .01)
      ctx.font = "0.018px Verdana"
      ctx.fillStyle = "#fff8";
      if (n > 0)
        ctx.fillText(`${n}`, 0, -0.01)
    }

    if (wc?.includes(s)) {
      drawCircleHere("#fff", .012)
    }

    if (colorblindMode) {
      ctx.fillStyle = "#fff8";
      ctx.font = "0.01px Verdana"
      ctx.fillText(s.kind[0], 0, 0.015)
    }

    ctx.translate(-s.at[0], -s.at[1]);
  }


  ctx.restore();

  removeFreshCard();
}

function drawCircleHere(color: string, r: number = .01, arc = false) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.arc(0, 0, r, 0, (arc ? 1 : 2) * Math.PI);
  ctx.stroke();
}


canvas.addEventListener("pointermove", pointerMove)

canvas.addEventListener("pointerdown", pointerDown)
