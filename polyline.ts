import { vecDiff, vecLen } from './util';

export default class PolyLine
{
  x: number[];
  y: number[];
  m: number[];
  mi: number[];
  s: number;

  constructor(x: number[], y: number[])
  {
    this.s = x.length;
    this.x = x;
    this.y = y;
    this.m = new Array(this.s);
    this.mi = new Array(this.s);
    for (let i=0; i<this.s - 1; i++) {
      this.m[i] = (this.y[i + 1] - this.y[i]) / (this.x[i + 1] - this.x[i]);
      this.mi[i] = 1 / this.m[i];
    }
  }

  findSegmentX(x: number)
  {
    if (x < this.x[0]) return 0;
    if (x > this.x[this.s - 1]) return this.s - 2;
    let s1 = 0, s2 = this.s - 1;
    while (s2 - s1 > 1) {
      const p = s1 + Math.floor((s2 - s1) / 2);
      if (x < this.x[p]) s2 = p; else s1 = p;
    }
    return s1;
  }

  findSegmentY(y: number)
  {
    if (y < this.y[0]) return 0;
    if (y > this.y[this.s - 1]) return this.s - 2;
    let s1 = 0, s2 = this.s - 1;
    while (s2 - s1 > 1) {
      const p = s1 + Math.floor((s2 - s1) / 2);
      if (y < this.y[p]) s2 = p; else s1 = p;
    }
    return s1;
  }

  Y(x: number)
  {
    const s = this.findSegmentX(x);
    return this.y[s] + this.m[s] * (x - this.x[s]);
  }

  X(y: number)
  {
    const s = this.findSegmentY(y);
    return this.x[s] + this.mi[s] * (y - this.y[s]);
  }

  dYdX(x: number)
  {
    return this.m[this.findSegmentX(x)];
  }

  dXdY(y: number)
  {
    return this.mi[this.findSegmentY(y)];
  }

  YdY(x: number)
  {
    const s = this.findSegmentX(x);
    return {
      y: this.y[s] + this.m[s] * (x - this.x[s]),
      dydx: this.m[s]
    };
  }

  XdX(y: number)
  {
    const s = this.findSegmentY(y);
    return {
      x: this.x[s] + this.mi[s] * (y - this.y[s]),
      dxdy: this.mi[s]
    };
  }

  static createArcLengthMap(
    pos: (t: number) => [number, number], t1: number, t2: number,
    d: number, accuracy: number = 0.1): PolyLine
  {
    const x = [0], y = [0];
    const maxErr = d * accuracy;
    let lp = pos(t1), ls = 0, lt = t1, dt = d;
    while (lt < t2) {
      let ds = vecLen(vecDiff(lp, pos(lt + dt)));
      let j=0;
      while (Math.abs(ds - d) > maxErr) {
        j++; if (j > 100) { console.log(ds, d); break; }
        dt *= (d / ds);
        ds = vecLen(vecDiff(lp, pos(lt + dt)))
      }
      lp = pos(lt + dt);
      ls += ds;
      lt += dt;
      x.push(ls);
      y.push(lt);
    }
    return new PolyLine(x, y);
  }
}