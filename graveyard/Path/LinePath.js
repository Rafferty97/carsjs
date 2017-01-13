export default class LinePath
{
  constructor(x, y, a, l)
  {
    this.x = x;
    this.y = y;
    this.a = a;
    this.l = l;
    this.n = [Math.cos(a), Math.sin(a)];
  }

  get length() {
    return this.l;
  }

  get blength() {
    return this.l;
  }

  posOffset(s, r) {
    return [
      this.x + this.n[0] * s - this.n[1] * r,
      this.y + this.n[1] * s + this.n[0] * r
    ];
  }

  pos(s) {
    return [
      this.x + this.n[0] * s,
      this.y + this.n[1] * s,
    ];
  }

  ang(s) {
    return this.a;
  }

  curve(s) {
    return 0;
  }

  bpos(s) { return this.pos(s); }
  bang(s) { return this.ang(s); }
  bcurve(s) { return this.curve(s); }
  lat(s) { return 0; }
  latd(s) { return 0; }
  maptobase(s) { return s; }
  mapfrombase(s) { return s; }
}
