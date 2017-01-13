const MERGE_OVERTAKE_TIME_SAFETY = 2;
const MERGE_EASE_FACTOR = 2;

export default class Car
{
  constructor(len=5, wid=2)
  {
    this.len = len;
    this.wid = wid;
    this.x = 0;
    this.v = 0;
    this.p = -1;
    this.maxacc = 2;
    this.maxv = 130 / 3.6;
    this.comfdec = 3;
  }

  followacc(x, v, _fx, fv, ms)
  {
    const fx = _fx - (this.len / 2);
    const ss = ms + (v * 2) + ((v * (v - fv)) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
    return this.maxacc * (1 - Math.pow(ss / (fx - x), 2));
  }

  mergeacc(x, v, _fx, fv, ms, dtm, ma, ot)
  {
    const fx = _fx - (this.len / 2);
    // Smooth merge
    const ss = ms + (v * 2) + ((v * (v - fv)) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
    let dec = -1000;
    if (fv > 0 && dtm > 0) {
      dec = (dtm + fx - ss - x) / Math.pow(dtm / fv, 2);
      dec -= v / (dtm / fv);
      dec *= MERGE_EASE_FACTOR;
    }
    // Should overtake?
    const mdtm = (dtm + (fx - x) + this.len);
    const ttm = (dtm / Math.max(fv, 0.01)) - MERGE_OVERTAKE_TIME_SAFETY;
    let a = this.maxacc;
    if (!ot || (ttm * (v + 0.5*ma*ttm) < mdtm)) {
      a = Math.max(dec, this.maxacc * (1 - Math.pow(ss / (fx - x), 2)));
      if (x + mdtm < _fx) {
        a = Math.min(a, this.followacc(x, v, x + mdtm, 0, ms));
      }
    }
    // Match lane speed
    if (dtm > 0) {
      const speed = Math.sqrt((fv * fv) + 2 * this.comfdec * mdtm);
      a = Math.min(a, this.speedacc(v, speed));
    }
    return a;
  }

  speedacc(v, s)
  {
    return this.maxacc * (1 - Math.pow(v / s, 4))
  }

  nextPath(n)
  {
    return Math.floor(Math.random() * n);
  }

  shouldPropogateBack(cond)
  {
    if (cond.t == 'merge') {
      //return true;
    }
    return false;
  }

  step(dt, conds)
  {
    conds.sort(cond => cond.t == 'merge' ? 1 : -1);
    let a = this.maxacc;
    let maxx = Infinity;
    for (let i=0; i<conds.length; i++) {
      const cond = conds[i];
      if (cond.t == 'car') {
        maxx = Math.min(maxx, cond.x - (this.len / 2));
        a = Math.min(a, this.followacc(this.x, this.v, cond.x, cond.v, 2.5));
      }
      if (cond.t == 'merge') {
        a = Math.min(a, this.mergeacc(this.x, this.v, cond.x, cond.v, 2.5, cond.dtm, a, cond.ot));
      }
      if (cond.t == 'stop') {
        a = Math.min(a, this.followacc(this.x, this.v, cond.x, 0, 1));
      }
      if (cond.t == 'speed') {
        a = Math.min(a, this.speedacc(this.v, cond.speed));
      }
    }
    // Integrate
    a = Math.max(-20, a);
    this.v += a * dt;
    this.v = Math.max(Math.min(this.v, this.maxv), 0);
    this.x += this.v * dt;
    if (this.x > maxx) {
      this.x = maxx;
      this.v = 0;
    }
  }
}
