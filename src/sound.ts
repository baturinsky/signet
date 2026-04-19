
/*

ZzFX - Zuper Zmall Zound Zynth v1.3.2 by Frank Force
https://github.com/KilledByAPixel/ZzFX

ZzFX Features

- Tiny synth engine with 20 controllable parameters.
- Play sounds via code, no need for sound assed files!
- Compatible with most modern web browsers.
- Small code footprint, the micro version is under 1 kilobyte.
- Can produce a huge variety of sound effect types.
- Sounds can be played with a short call. zzfx(...[,,,,.1,,,,9])
- A small bit of randomness appied to sounds when played.
- Use ZZFX.GetNote to get frequencies on a standard diatonic scale.
- Sounds can be saved out as wav files for offline playback.
- No additional libraries or dependencies are required.

*/
/*

  ZzFX MIT License
  
  Copyright (c) 2019 - Frank Force
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  
*/

'use strict';

// play a zzfx sound
export function zzfx(...parameters: number[]) { return ZZFX.play(...parameters) }

///////////////////////////////////////////////////////////////////////////////
// ZZFX API for playing sounds
export const ZZFX =
{
  // master volume scale
  volume: .3,

  // sample rate for audio
  sampleRate: 44100,

  // create shared audio context
  audioContext: new AudioContext,

  // play a sound from zzfx paramerters
  play: function (...parameters: number[]) {
    // build samples and start sound
    return this.playSamples([this.buildSamples(...parameters)]);
  },

  // play an array of samples
  playSamples: function (sampleChannels, volumeScale = 1, rate = 1, pan = 0, loop = false) {
    // create buffer and source
    const channelCount = sampleChannels.length;
    const sampleLength = sampleChannels[0].length;
    const buffer = this.audioContext.createBuffer(channelCount, sampleLength, this.sampleRate);
    const source = this.audioContext.createBufferSource();

    // copy samples to buffer and setup source
    sampleChannels.forEach((c, i) => buffer.getChannelData(i).set(c));
    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.loop = loop;

    // create and connect gain node
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.volume * volumeScale;
    gainNode.connect(this.audioContext.destination);

    // connect source to stereo panner and gain
    const pannerNode = new StereoPannerNode(this.audioContext, { 'pan': pan });
    source.connect(pannerNode).connect(gainNode);
    source.start();

    // return sound
    return source;
  },

  // build an array of samples
  buildSamples: function
    (
      volume = 1,
      randomness = .05,
      frequency = 220,
      attack = 0,
      sustain = 0,
      release = .1,
      shape = 0,
      shapeCurve = 1,
      slide = 0,
      deltaSlide = 0,
      pitchJump = 0,
      pitchJumpTime = 0,
      repeatTime = 0,
      noise = 0,
      modulation = 0,
      bitCrush = 0,
      delay = 0,
      sustainVolume = 1,
      decay = 0,
      tremolo = 0,
      filter = 0
    ) {
    // init parameters
    let sampleRate = this.sampleRate,
      PI2 = Math.PI * 2,
      abs = Math.abs,
      sign = v => v < 0 ? -1 : 1,
      startSlide = slide *= 500 * PI2 / sampleRate / sampleRate,
      startFrequency = frequency *=
        (1 + randomness * 2 * Math.random() - randomness) * PI2 / sampleRate,
      modOffset = 0, // modulation offset  
      repeat = 0,    // repeat offset
      crush = 0,     // bit crush offset
      jump = 1,      // pitch jump timer
      length,        // sample length
      b = [],        // sample buffer
      t = 0,         // sample time
      i = 0,         // sample index 
      s = 0,         // sample value
      f,             // wave frequency

      // biquad LP/HP filter
      quality = 2, w = PI2 * abs(filter) * 2 / sampleRate,
      cos = Math.cos(w), alpha = Math.sin(w) / 2 / quality,
      a0 = 1 + alpha, a1 = -2 * cos / a0, a2 = (1 - alpha) / a0,
      b0 = (1 + sign(filter) * cos) / 2 / a0,
      b1 = -(sign(filter) + cos) / a0, b2 = b0,
      x2 = 0, x1 = 0, y2 = 0, y1 = 0;

    // scale by sample rate
    const minAttack = 9; // prevent pop if attack is 0
    attack = attack * sampleRate || minAttack;
    decay *= sampleRate;
    sustain *= sampleRate;
    release *= sampleRate;
    delay *= sampleRate;
    deltaSlide *= 500 * PI2 / sampleRate ** 3;
    modulation *= PI2 / sampleRate;
    pitchJump *= PI2 / sampleRate;
    pitchJumpTime *= sampleRate;
    repeatTime = repeatTime * sampleRate | 0;
    volume *= this.volume;

    // generate waveform
    for (length = attack + decay + sustain + release + delay | 0;
      i < length; b[i++] = s * volume)                   // sample
    {
      if (!(++crush % (bitCrush * 100 | 0)))                   // bit crush
      {
        s = shape ? shape > 1 ? shape > 2 ? shape > 3 ? shape > 4 ? // wave shape
          (t / PI2 % 1 < shapeCurve / 2 ? 1 : -1) :         // 5 square duty
          Math.sin(t ** 3) :                           // 4 noise
          Math.max(Math.min(Math.tan(t), 1), -1) :      // 3 tan
          1 - (2 * t / PI2 % 2 + 2) % 2 :                         // 2 saw
          1 - 4 * abs(Math.round(t / PI2) - t / PI2) :          // 1 triangle
          Math.sin(t);                               // 0 sin

        s = (repeatTime ?
          1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) // tremolo
          : 1) *
          (shape > 4 ? s : sign(s) * abs(s) ** shapeCurve) * // shape curve
          (i < attack ? i / attack :                 // attack
            i < attack + decay ?                     // decay
              1 - ((i - attack) / decay) * (1 - sustainVolume) : // decay falloff
              i < attack + decay + sustain ?          // sustain
                sustainVolume :                          // sustain volume
                i < length - delay ?                     // release
                  (length - i - delay) / release *           // release falloff
                  sustainVolume :                          // release volume
                  0);                                      // post release

        s = delay ? s / 2 + (delay > i ? 0 :           // delay
          (i < length - delay ? 1 : (length - i) / delay) * // release delay 
          b[i - delay | 0] / 2 / volume) : s;              // sample delay

        if (filter)                                  // apply filter
          s = y1 = b2 * x2 + b1 * (x2 = x1) + b0 * (x1 = s) - a2 * y2 - a1 * (y2 = y1);
      }

      f = (frequency += slide += deltaSlide) *// frequency
        Math.cos(modulation * modOffset++);   // modulation
      t += f + f * noise * Math.sin(i ** 5);        // noise

      if (jump && ++jump > pitchJumpTime)     // pitch jump
      {
        frequency += pitchJump;             // apply pitch jump
        startFrequency += pitchJump;        // also apply to start
        jump = 0;                           // stop pitch jump time
      }

      if (repeatTime && !(++repeat % repeatTime)) // repeat
      {
        frequency = startFrequency;   // reset frequency
        slide = startSlide;           // reset slide
        jump ||= 1;                   // reset pitch jump time
      }
    }

    return b; // return sample buffer
  },

  // get frequency of a musical note on a diatonic scale
  getNote: function (semitoneOffset = 0, rootNoteFrequency = 440) {
    return rootNoteFrequency * 2 ** (semitoneOffset / 12);
  }
}

///////////////////////////////////////////////////////////////////////////////
// Sound object that can precache and play ZZFX sounds
export class ZZFXSound {
  constructor(zzfxSound = []) {
    this.zzfxSound = zzfxSound;

    // extract randomness parameter from zzfxSound
    this.randomness = zzfxSound[1] != undefined ? zzfxSound[1] : .05;
    zzfxSound[1] = 0; // generate without frequency randomness

    // cache the sound samples
    this.samples = ZZFX.buildSamples(...zzfxSound);
  }

  play(volume = 1, pitch = 1, randomnessScale = 1, pan = 0, loop = false) {
    if (!this.samples) return;

    // play the sound
    const playbackRate = pitch + pitch * this.randomness * randomnessScale * (Math.random() * 2 - 1);
    this.source = ZZFX.playSamples([this.samples], volume, playbackRate, pan, loop);
    return this.source;
  }
}


export function BuildRandomSound(lengthScale = 1, volume = 1, randomness = .05, rng: () => number) {
  // generate a random sound
  const R: () => number = rng ?? (() => Math.random()), C = () => R() < .5 ? R() : 0, S = () => C() ? 1 : -1,

    // randomize sound length
    attack = R() ** 3 / 2 * lengthScale,
    decay = R() ** 3 / 2 * lengthScale,
    sustain = R() ** 3 / 2 * lengthScale,
    release = R() ** 3 / 2 * lengthScale,
    length = attack + decay + sustain + release,
    filter = C() ? 0 : R() < .5 ? 99 + R() ** 2 * 900 : R() ** 2 * 1e3 - 1500,

    frequency = 9 + R() ** 2 * 1e3,
    shape = R() * 6 | 0,
    shapeCurve = R() * 4,
    slide = C() ** 3 * 99 * S(),
    deltaSlide = C() ** 3 * 99 * S(),
    pitchJump = C() ** 2 * 500 * S(),
    pitchJumpTime = R() ** 2 * length,
    repeatTime = C() * length / 4,
    noise = C() ** 4,
    modulation = R() * C() ** 2 * 500,
    bitCrush = C() ** 4,
    delay = C() ** 3 / 2,
    sustainVolume = 1 - R() * .5,
    tremolo = C() ** 2 * .5;

  // create random sound
  return {
    volume,
    randomness,
    frequency,
    attack,
    sustain,
    release,
    shape,
    shapeCurve,
    slide,
    deltaSlide,
    pitchJump,
    pitchJumpTime,
    repeatTime,
    noise,
    modulation,
    bitCrush,
    delay,
    sustainVolume,
    decay,
    tremolo,
    filter
  };
}

const waveShapeCount = 6;

const NoteName = (n: number) => "CCDDEFFGGAAB"[n % 12 | 0] + ('02579'.indexOf(n % 12 - 1) < 0 ? '' : '#') + (n / 12 | 0);

let noteScale: number[][] = [];
for (let i = 0; i < 37; i++) {
  // skip sharps
  if ([1, 3, 6, 8, 10].includes(i % 12))
    continue;

  noteScale.push([ZZFX.getNote(i + 3 - 36).toPrecision(7), NoteName(i)]);
}

export function generateMusic() {
  let sound = BuildSound();
  const R = (a = 1, b = 0) => b + (a - b) * Math.random();

  if (R() < .5) // apply random filter
    sound.filter = R() < .5 ? 99 + R() ** 2 * 900 : R() ** 2 * 1e3 - 1500;

  // set shape curve
  sound.shapeCurve = R() * 4;
  sound.frequency = noteScale[(R(3) | 0) * 7][0];
  sound.randomness = 0;
  sound.shape = R() < .2 ? 5 : R(3) | 0;
  sound.attack = R() < .3 ? R(.05) : R(.2);
  sound.decay = R(.2);
  sound.sustain = R(1);
  sound.sustainVolume = R(.3, 1);
  sound.release = R(.05, .5);
  sound.delay = R() < .5 ? 0 : R(.2);
  sound.noise = R() < .3 ? 0 : R(.4);
  sound.bitCrush = R() < .3 ? 0 : R(.1);
  if (R() < .5) {
    // tremolo
    sound.repeatTime = R(.1, .4);
    sound.tremolo = R(.5);
  }

  const Fixed = (v, l = 2) => {
    if (v > 10 || v < -10)
      l = 0;
    const f = v.toFixed(l);
    return !parseFloat(f) ? 0 : f;
  }

  // convert to fixed point
  if (typeof sound.frequency != 'string')
    sound.frequency = Fixed(sound.frequency, 0);
  sound.shapeCurve = Fixed(sound.shapeCurve, 1);
  sound.attack = Fixed(sound.attack);
  sound.sustain = Fixed(sound.sustain);
  sound.release = Fixed(sound.release);
  sound.slide = Fixed(sound.slide, 0);
  sound.deltaSlide = Fixed(sound.deltaSlide, 0);
  sound.noise = Fixed(sound.noise, 1);
  sound.pitchJump = Fixed(sound.pitchJump, 0);
  sound.pitchJumpTime = Fixed(sound.pitchJumpTime);
  sound.repeatTime = Fixed(sound.repeatTime, 2);
  sound.modulation = Fixed(sound.modulation, 1);
  sound.bitCrush = Fixed(sound.bitCrush, 1);
  sound.delay = Fixed(sound.delay);
  sound.sustainVolume = Fixed(sound.sustainVolume);
  sound.decay = Fixed(sound.decay);
  sound.tremolo = Fixed(sound.tremolo);
  sound.filter = Fixed(sound.filter, 0);

  return sound;
}

function BuildSound
  (
    volume = 1,
    randomness = .05,
    frequency = 220,
    attack = 0,
    sustain = 0,
    release = .1,
    shape = 0,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    sustainVolume = 1,
    decay = 0,
    tremolo = 0,
    filter = 0
  ) {
  const sound =
  {
    volume,
    randomness,
    frequency,
    attack,
    sustain,
    release,
    shape,
    shapeCurve,
    slide,
    deltaSlide,
    pitchJump,
    pitchJumpTime,
    repeatTime,
    noise,
    modulation,
    bitCrush,
    delay,
    sustainVolume,
    decay,
    tremolo,
    filter
  };

  return sound;
}

export function SoundToArray(sound: any) {
  // use default sound for keys and order
  const array = [];
  for (const key in sound)
    array.push(sound[key]);
  return array;
}


export class NotesPlayer {
  NOTES = { "PAUSE": 0.1, "C": 261.63, "C#": 277.18, "Db": 277.18, "D": 293.66, "D#": 311.13, "Eb": 311.13, "E": 329.63, "F": 349.23, "F#": 369.99, "Gb": 369.99, "G": 392, "G#": 415.30, "Ab": 415.30, "A": 440, "A#": 466.16, "Bb": 466.16, "B": 493.88 };
  context: AudioContext;

  constructor() {

    let audioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new audioContextClass();
  }
  // NotesPlayer

  /**  
  * @function
  * Play note given musical note, octave (), duration (in seconds with decimals, eg. 2.33), 
  *
  * @param {string} note - musical note (eg. Ab, A, A#)
  * @param {integer} octave - eg. -2, -1, 0, 1, 2 such that 0 represents no octave shift
  * @param {integer} bpm - eg. 60 OR null
  * @param {float} durationSecondsPerBeat - OPTIONAL. eg. 1, 2, 2.33. If duration is not provided, then we are assuming 4 notes per measure and the duration per beat will be calculated by the BPM; Otherwise, you could pass a duration for that note to override that calculation (and you could pass null to bpm).
  *
  */
  play(note:string, octave=0, bpm = 60, durationSecondsPerBeat = 1 / (bpm / 60)) {
    let context = this.context,
      freq = this.NOTES[note],
      octaveFactor = Math.pow(2, octave);

    console.log(`Playing note ${note} at ${octave === 0 ? "same octave" : (octave > 0 ? "+" + octave + " octave" : octave + " octave")} for ${durationSecondsPerBeat} seconds at ${bpm}bpm`);

    var o = context.createOscillator();
    o.frequency.setTargetAtTime(freq * octaveFactor, context.currentTime, 0);
    let g = context.createGain();
    o.connect(g);
    g.connect(context.destination);
    o.start();
    g.gain.setTargetAtTime(0, context.currentTime + durationSecondsPerBeat, 0.015);
  }

  /**  
  * @function
  * Pause to allow your notes to play sequentially or simultaneously part way through a beat. 
  * If playing a chord, then call play multiple times without a pause inbetween.
  *
  * @param {string} ms - The pause in milliseconds
  * 
  */

  pause(ms) {
    console.log(`Pausing for ${ms} milliseconds.`);

    const startTime = new Date().getTime();
    for (var i = 0; i < 1e14; i++) { // originally 1e7 but 1e14 is more precise when 30bpm and you dont want overlapping beats
      let currentTime = new Date().getTime();
      if ((currentTime - startTime) > ms) break;
    } // for
  }
}

export let notes = new NotesPlayer();