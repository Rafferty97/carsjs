import LinePath from './LinePath';
import LinePathLat from './LinePathLat';
import ArcPath from './ArcPath';
import ArcPathLat from './ArcPathLat';
import ClothoidPath from './ClothoidPath';
import ClothoidPathLat from './ClothoidPathLat';

export default class PolyPath
{
  constructor(_x, _y, _a, d)
  {
    this.segs = [];
    this.xya = [[_x, _y, _a]];
    this.l = 0;
    this.ll = 0;
    let x = _x, y = _y, a = _a;
    for (let i=0; i<d.length;) {
      let s, ni = i;
      if (d[i] == 'l') {
        s = new LinePath(x, y, a, d[i+1]);
        ni = i + 2;
      }
      if (d[i] == 'l*') {
        s = new LinePathLat(x, y, a, d[i+1], d[i+2], d[i+3], d[i+4], d[i+5]);
        ni = i + 6;
      }
      if (d[i] == 'a') {
        s = new ArcPath(x, y, a, d[i+1], d[i+2]);
        ni = i + 3;
      }
      if (d[i] == 'a*') {
        s = new ArcPathLat(x, y, a, d[i+1], d[i+2], d[i+3], d[i+4], d[i+5], d[i+6]);
        ni = i + 7;
      }
      if (d[i] == 'c') {
        s = new ClothoidPath(x, y, a, d[i+1], d[i+2], d[i+3]);
        ni = i + 4;
      }
      if (d[i] == 'c*') {
        s = new ClothoidPathLat(x, y, a, d[i+1], d[i+2], d[i+3], d[i+4], d[i+5], d[i+6], d[i+7]);
        ni = i + 8;
      }
      if (ni == i) break;
      this.l += s.length;
      this.ll += s.blength;
      this.segs.push(s);
      [x, y] = s.bpos(s.blength);
      a = s.bang(s.blength);
      this.xya.push([x, y, a]);
      i = ni;
    }
  }

  get length() {
    return this.l;
  }

  get blength() {
    return this.ll;
  }

  posOffset(s, o) {
    let seg = 0, ss = s;
    while (ss > this.segs[seg].length) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].length;
      seg++;
    }
    return this.segs[seg].posOffset(ss, o);
  }

  pos(s) {
    let seg = 0, ss = s;
    while (ss > this.segs[seg].length) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].length;
      seg++;
    }
    return this.segs[seg].pos(ss);
  }

  ang(s) {
    let seg = 0, ss = s;
    while (ss > this.segs[seg].length) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].length;
      seg++;
    }
    return this.segs[seg].ang(ss);
  }

  curve(s) {
    let seg = 0, ss = s;
    while (ss > this.segs[seg].length) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].length;
      seg++;
    }
    return this.segs[seg].curve(ss);
  }

  bpos(s) {
    let seg = 0, ss = s;
    while (ss > this.segs[seg].blength) {
    if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].blength;
      seg++;
    }
    return this.segs[seg].bpos(ss);
  }

  bang(s) {
    let seg = 0, ss = s;
    while (ss > this.segs[seg].blength) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].blength;
      seg++;
    }
    return this.segs[seg].bang(ss);
  }

  bcurve(s) {
    let seg = 0, ss = s;
    while (ss > this.segs[seg].blength) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].blength;
      seg++;
    }
    return this.segs[seg].bcurve(ss);
  }

  lat(s) {
    let seg = 0, ss = s;
    while (ss > this.segs[seg].blength) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].blength;
      seg++;
    }
    return this.segs[seg].lat(ss);
  }

  latd(s) {
    let seg = 0, ss = s;
    while (ss > this.segs[seg].blength) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].blength;
      seg++;
    }
    return this.segs[seg].latd(ss);
  }

  maptobase(s) {
    let seg = 0, ss = s, dif = 0;
    while (ss > this.segs[seg].length) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].length;
      dif += this.segs[seg].blength;
      seg++;
    }
    return dif + this.segs[seg].maptobase(ss);
  }

  mapfrombase(s) {
    let seg = 0, ss = s, dif = 0;
    while (ss > this.segs[seg].blength) {
      if (seg == this.segs.length - 1) break;
      ss -= this.segs[seg].blength;
      dif += this.segs[seg].length;
      seg++;
    }
    return dif + this.segs[seg].mapfrombase(ss);
  }
}
