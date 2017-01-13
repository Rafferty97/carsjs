import ClothoidPath from './Path/ClothoidPath';
import ArcPath from './Path/ArcPath';
import LinePath from './Path/LinePath';
import ClothoidPathLat from './Path/ClothoidPathLat';
import ArcPathLat from './Path/ArcPathLat';
import LinePathLat from './Path/LinePathLat';
import PolyPath from './Path/PolyPath';
import Spline from './Path/Spline';

/* function offset(pos, ang, o)
{
  const a = ang + Math.PI * 0.5;
  return [pos[0] + Math.cos(a) * o, pos[1] + Math.sin(a) * o];
} */

function parseGeom(geom, x, y, a)
{
  const descr = {
    x: x + geom[0],
    y: y + geom[1],
    a: a + geom[2],
    p: []
  }
  for (let i=3; i<geom.length;) {
    const seg = {
      t: geom[i],
      l: 0,
      c1: 0,
      c2: 0,
      so: 0,
      eo: 0,
      soa: 0,
      eoa: 0
    };
    const li = i;
    switch (seg.t) {
      case 'l':
      seg.l = geom[i+1];
      i += 2;
      break;
      case 'a':
      seg.c1 = geom[i+1]; seg.l = geom[i+2];
      i += 3;
      break;
      case 'c':
      seg.c1 = geom[i+1]; seg.c2 = geom[i+2]; seg.l = geom[i+3];
      i += 4;
      break;
      case 'l*':
      seg.l = geom[i+1];
      seg.so = geom[i+2]; seg.eo = geom[i+3]; seg.soa = geom[i+4]; seg.eoa = geom[i+5];
      i += 6;
      break;
      case 'a*':
      seg.c1 = geom[i+1]; seg.l = geom[i+2];
      seg.so = geom[i+3]; seg.eo = geom[i+4]; seg.soa = geom[i+5]; seg.eoa = geom[i+6];
      i += 7;
      break;
      case 'c*':
      seg.c1 = geom[i+1]; seg.c2 = geom[i+2]; seg.l = geom[i+3];
      seg.so = geom[i+4]; seg.eo = geom[i+5]; seg.soa = geom[i+6]; seg.eoa = geom[i+7];
      i += 8;
      break;
    }
    if (li == i) break;
    descr.p.push(seg);
  }
  return descr;
}

function buildPath(descr)
{
  const { x, y, a } = descr;
  if (descr.p.length == 0) return new LinePath(x, y, a, 0);
  if (descr.p.length == 1) {
    const seg = descr.p[0];
    switch (seg.t) {
      case 'l': return new LinePath(x, y, a, seg.l);
      case 'a': return new ArcPath(x, y, a, seg.c1, seg.l);
      case 'c': return new ClothoidPath(x, y, a, seg.c1, seg.c2, seg.l);
      case 'l*': return new LinePathLat(x, y, a, seg.l, seg.so, seg.eo, seg.soa, seg.eoa);
      case 'a*': return new ArcPathLat(x, y, a, seg.c1, seg.l, seg.so, seg.eo, seg.soa, seg.eoa);
      case 'c*': return new ClothoidPathLat(x, y, a, seg.c1, seg.c2, seg.l, seg.so, seg.eo, seg.soa, seg.eoa);
    }
  } else {
    let segs = [];
    descr.p.forEach(seg => {
      const { t, l, c1, c2, so, eo, soa, eoa } = seg;
      segs.push(t);
      let arr;
      switch (t) {
        case 'l': arr = [l]; segs = segs.concat(arr); return;
        case 'a': arr = [c1, l]; segs = segs.concat(arr); return;
        case 'c': arr = [c1, c2, l]; segs = segs.concat(arr); return;
        case 'l*': arr = [l, so, eo, soa, eoa]; segs = segs.concat(arr); return;
        case 'a*': arr = [c1, l, so, eo, soa, eoa]; segs = segs.concat(arr); return;
        case 'c*': arr = [c1, c2, l, so, eo, soa, eoa]; segs = segs.concat(arr); return;
      }
    });
    return new PolyPath(x, y, a, segs);
  }
}

function createLanePath(bd, bp, lat, reverse = false)
{
  const sind = reverse ? 3 * (Math.floor(lat.length / 3) - 1) : 0;
  const xy = bp.bpos(lat[sind]);
  const descr = {
    x: xy[0],
    y: xy[1],
    a: bp.bang(lat[sind]) + (reverse ? Math.PI : 0),
    p: []
  };
  let j=0, jl=0;
  for (let i=0; i<(lat.length/3)-1; i++) {
    const [x1, y1, a1, x2, y2, a2] = lat.slice(i*3);
    const spline = new Spline(y1, y2, a1, a2, x2 - x1);
    let x = x1, _x = x1;
    while (jl < x2) {
      const seg = bd.p[j];
      const spline2 = new Spline(seg.so, seg.eo, seg.soa, seg.eoa, seg.l);
      if (jl + seg.l > x1) {
        x = Math.min(x2, jl + seg.l);
        descr.p.push({
          t: seg.t.length == 1 ? seg.t + '*' : seg.t,
          l: x - _x,
          c1: bp.bcurve(_x),
          c2: bp.bcurve(x),
          so: spline.y(_x - x1) + spline2.y(_x - jl),
          eo: spline.y( x - x1) + spline2.y( x - jl),
          soa: spline.yd(_x - x1) + spline2.yd(_x - jl),
          eoa: spline.yd( x - x1) + spline2.yd( x - jl)
        });
        if (jl + seg.l >= x2) break;
        _x = x;
      }
      jl += seg.l;
      j++;
      if (j == bd.p.length) break;
    }
  }
  if (reverse) {
    descr.p.reverse();
    descr.p = descr.p.map(seg => ({
      t: seg.t,
      l: seg.l,
      c1: -seg.c2,
      c2: -seg.c1,
      so: -seg.eo,
      eo: -seg.so,
      soa: seg.eoa,
      eoa: seg.soa
    }));
  }
  const path = buildPath(descr);
  return path;
}

export default class LogicalNetwork
{
  constructor(jsonObj)
  {
    this.paths = [];

    if (jsonObj != null) {
      this.load(jsonObj);
    }
  }

  load(_jsonObj)
  {
    const jsonObj = Object.assign({}, _jsonObj);
    this.roads = [];
    this.paths = [];
    this.lanes = new Map();
    this.splits = [];
    this.merges = [];
    this.lccars = [];
    if (jsonObj.roads) {
      if (!jsonObj.paths) jsonObj.paths = [];
      jsonObj.roads.forEach((road, r) => {
        const ri = this.roads.length;
        const bd = parseGeom(road.geom, 0, 0, 0);
        const bp = buildPath(bd);
        this.roads.push({ bd, bp });
        road.lanesforward.forEach((lane, l) => {
          jsonObj.paths.push({
            path: createLanePath(bd, bp, lane, false),
            road: ri,
            roadrev: false,
            roadoff: lane[0],
            _next: road.nextforward[l]
          });
          this.lanes.set('r' + r + 'f' + l, jsonObj.paths.length - 1);
        });
        road.lanesreverse.forEach((lane, l) => {
          jsonObj.paths.push({
            path: createLanePath(bd, bp, lane, true),
            road: ri,
            roadrev: true,
            roadoff: bp.blength - lane[lane.length - 3],
            _next: road.nextreverse[l]
          });
          this.lanes.set('r' + r + 'r' + l, jsonObj.paths.length - 1);
        });
      });
      const linksIn = new Map();
      jsonObj.paths.forEach((path, pid) => {
        if (!path._next) return;
        path.next = path._next.map(n => {
          const dl = this.lanes.get(n);
          if (!linksIn.has(dl)) linksIn.set(dl, []);
          linksIn.get(dl).push(pid);
          return dl;
        });
        if (path.next.length > 1) {
          this.splits.push({ paths: path.next, x: path.next.map(p => 0), l: 30 });
        }
        delete path._next;
      });
      linksIn.forEach(paths => {
        if (paths.length < 2) return;
        this.merges.push({
          paths,
          x: paths.map(p => jsonObj.paths[p].path.length),
          l: 30,
          ot: true
        });
      });
    }
    if (jsonObj.paths) {
      for (let i=0; i<jsonObj.paths.length; i++) {
        const p = jsonObj.paths[i];
        let pathdescr, path;
        if (p.path) {
          path = p.path;
        } else {
          if (p.geomrel) {
            const rpath = this.paths[p.geomrel].p;
            const rpos = rpath.pos(rpath.length);
            pathdescr = parseGeom(p.geom, rpos[0], rpos[1], rpath.ang(rpath.length));
          } else {
            pathdescr = parseGeom(p.geom, 0, 0, 0);
          }
          path = buildPath(pathdescr);
        }
        if (path) this.paths.push({
          p: path,
          cars: [],
          next: p.next == null ? [] : (Array.isArray(p.next) ? p.next : [p.next]),
          prev: [],
          road: p.road,
          roadoff: p.roadoff,
          roadrev: !!p.roadrev,
          lc: false
        });
      }
      for (let i=0; i<this.paths.length; i++) {
        this.paths[i].next.forEach(p => this.paths[p].prev.push(i));
      }
    }
  }

  draw(ctx, scale)
  {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 1500, 1000);
    ctx.setTransform(scale, 0, 0, scale, 50, 50);
    ctx.lineWidth = 0.8 / scale;
    ctx.strokeStyle = '#000000';
    /* Draw paths */
    /*for (let i=0; i<this.paths.length; i++) {
      const path = this.paths[i];
      if (path.lc) continue;
      const step = 1;
      let p = path.p.pos(0);
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      for (let s=step; s<path.p.length; s+=step) {
        p = path.p.pos(s);
        ctx.lineTo(p[0], p[1]);
      }
      p = path.p.pos(path.p.length);
      ctx.lineTo(p[0], p[1]);
      ctx.stroke();
      ctx.closePath();
    }*/
    for (let i=0; i<this.roads.length; i++) {
      const path = this.roads[i].bp;
      const step = 1;
      for (let n=0; n<6; n++) {
        const o = [-8.5, -4.5, -0.5, 0.5, 4.5, 8.5][n];
        if ([1, 4].indexOf(n) != -1)
          ctx.setLineDash([3, 6]);
        else ctx.setLineDash([]);
        let p = path.posOffset(0, o);
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        for (let s=step; s<path.length; s+=step) {
          p = path.posOffset(s, o);
          ctx.lineTo(p[0], p[1]);
        }
        p = path.posOffset(path.length, o);
        ctx.lineTo(p[0], p[1]);
        ctx.stroke();
        ctx.closePath();
      }
    }
    ctx.setLineDash([]);
    /* Draw Cars */
    for (let i=0; i<this.paths.length; i++) {
      const path = this.paths[i];
      for (let j=0; j<path.cars.length; j++) {
        const car = path.cars[j];
        const [x, y] = path.p.pos(car.x);
        const a = path.p.ang(car.x);
        ctx.save();
        ctx.transform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), x, y);
        ctx.beginPath();
        ctx.moveTo(-car.len/2, -car.wid/2);
        ctx.lineTo( car.len/2, -car.wid/2);
        ctx.lineTo( car.len/2,  car.wid/2);
        ctx.lineTo(-car.len/2,  car.wid/2);
        ctx.lineTo(-car.len/2, -car.wid/2);
        const v = car.v / car.maxv;
        ctx.fillStyle = `rgb(${Math.floor(255*Math.max(0, Math.min(1, 10 * (1 - v))))}, ${Math.floor(255*Math.max(0, Math.min(1, v / 0.9)))}, 0)`;
        if (car.__m) ctx.fillStyle = '#808080';
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
        /*const conds = this.conds.get(car);
        for (let i=0; i<conds.length; i++) {
          if (conds[i].t != 'merge') continue;
          if (conds[i].x > car.x + 20) continue;
          const [x2, y2] = this.paths[conds[i].c.p].p.pos(conds[i].c.x);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x2 + 0.5, y2 + 0.5);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.closePath();
        }*/
      }
    }
  }

  propogateBack(pid, x, lim, onlyfirst, _cond)
  {
    const cond = _cond;
    const path = this.paths[pid];
    let found = false;
    for (let i = path.cars.length-1; i >= 0; i--) {
      const car = path.cars[i];
      if (car.x >= x) continue;
      if (!this.conds.get(car)) this.conds.set(car, []);
      const conds = this.conds.get(car);
      conds.push(cond);
      if (onlyfirst && !car.shouldPropogateBack(cond)) {
        found = true;
        break;
      }
    }
    if (x > lim) return;
    if (!found || !onlyfirst) {
      path.prev.forEach((npid) => {
        const nx = x + this.paths[npid].p.length;
        const cond = Object.assign({}, _cond, {
          r: [pid].concat(_cond.r || []),
          x: _cond.x + this.paths[npid].p.length
        });
        this.propogateBack(npid, nx, lim, onlyfirst, cond);
      });
    }
  }

  calculateConditions()
  {
    this.conds = new Map();
    this.paths.forEach((path, p) => {
      path.cars.forEach((car, c) => {
        if (!this.conds.get(car)) this.conds.set(car, []);

        // 60 km/h
        //this.conds.get(car).push({ t: 'speed', speed: 60 / 3.6 });

        // Following car
        this.propogateBack(
          p, car.x, 500, true,
          { t: 'car', x: car.x - (car.len / 2), v: car.v }
        );

        // Merging
        this.merges.forEach(merge => {
          const tp = merge.paths.indexOf(p);
          if (tp == -1) return;
          const x1 = car.x - merge.x[tp];
          let x2 = x1 - (car.len / 2);
          for (let i=0; i<merge.paths.length; i++) {
            if (i == tp) continue;
            const d = merge.x[i];
            this.propogateBack(
              merge.paths[i], x1 + d, 500, true,
              { t: 'merge', c: car, x: x2 + d, v: car.v, dtm: Math.max(0, (-x1)-merge.l), ot: merge.ot }
            );
          }
        });

        // Diverging
        this.splits.forEach(split => {
          const tp = split.paths.indexOf(p);
          if (tp == -1) return;
          const x1 = car.x - split.x[tp];
          if (x1 > split.l) return;
          let x2 = x1 - (car.len / 2);
          for (let i=0; i<split.paths.length; i++) {
            if (i == tp) continue;
            const d = split.x[i];
            this.propogateBack(
              split.paths[i], x1 + d, 500, true,
              { t: 'car', x: x2 + d, v: car.v }
            );
          }
        });

        // Keeping lane-changing cars apart
        const lccar = this.lccars.find(o => o.car == car);
        if (typeof lccar !== 'undefined') {
          let minx = Infinity, minx2 = 0, v = 0;
          for (let i=0; i<this.lccars.length; i++) {
            const olc = this.lccars[i];
            if (lccar.paths[0] != olc.paths[0] && lccar.paths[1] != olc.paths[0] && lccar.paths[0] != olc.paths[1] && lccar.paths[1] != olc.paths[1]) continue;
            const nx = olc.car.x + olc.ox;
            if (nx <= car.x + lccar.ox) continue;
            if (nx < minx) { minx = nx; minx2 = nx-(olc.car.len/2); v = olc.car.v; }
          }
          if (minx != Infinity) {
            minx -= lccar.ox;
            minx -= 2;
            this.conds.get(car).push({ t: 'car', x: minx, v });
          }
        }

      });
    });
  }

  doLaneChange(pathId, carId, destPath, dist)
  {
    const path = this.paths[pathId];
    const rev = path.roadrev;
    const dpath = this.paths[destPath];
    const car = this.paths[pathId].cars[carId];
    path.cars.splice(carId, 1);
    const road = this.roads[path.road];
    const x3 = path.p.maptobase(car.x);
    const x4 = x3 + dist + (path.roadoff - dpath.roadoff);
    let x1 = x3 + path.roadoff;
    let x2 = x4 + dpath.roadoff;
    const _x1 = x1;
    if (rev) { x1 = road.bp.blength - x1; x2 = road.bp.blength - x2; }
    const x5 = dpath.p.mapfrombase(x4);
    let lane = [x1, path.p.lat(x3), path.p.latd(x3), x2, dpath.p.lat(x4), dpath.p.latd(x4)];
    lane[1] -= road.bp.lat(x1);
    lane[2] -= road.bp.latd(x1);
    lane[4] -= road.bp.lat(x2);
    lane[5] -= road.bp.latd(x2);
    if (rev) {
      lane = [
        lane[3], -lane[4], -lane[5],
        lane[0], -lane[1], -lane[2],
      ];
    }
    const mpath = createLanePath(road.bd, road.bp, lane, rev);
    car.p = this.paths.length;
    this.splits.push({
      paths: [pathId, car.p],
      x: [car.x, 0],
      l: mpath.length * 0.7,
    });
    this.merges.push({
      paths: [destPath, car.p],
      x: [x5, mpath.length],
      l: mpath.length * 0.7,
      ot: false
    });
    this.lccars.push({ car: car, ox: _x1, paths: [pathId, destPath] });
    car.x = 0;
    this.paths.push({ p: mpath, cars: [car], next: [destPath], prev: [], lc: true, lco: x5 });
  }

  step(dt)
  {
    this.calculateConditions();
    const switchedCars = [];
    for (let i=0; i<this.paths.length; i++) {
      const path = this.paths[i];
      for (let j=0; j<path.cars.length; j++) {
        const car = path.cars[j];
        car.step(dt, this.conds.get(car) || []);
        if (car.x > path.p.length) {
          car.x -= path.p.length;
          car.p = path.lc ? path.next[0] : path.next[car.nextPath(path.next.length)];
          if (path.lc) {
            car.x += path.lco;
            this.lccars = this.lccars.filter(o => o.car != car);
          }
          switchedCars.push(car);
          car._s = true;
        } else {
          car._s = false;
        }
      }
      path.cars = path.cars.filter(car => !car._s);
      path._r = false;
      if (path.lc && path.cars.length == 0) path._r = true;
    }
    while (this.paths[this.paths.length-1]._r) {
      this.paths.pop();
      this.splits = this.splits.filter(s => s.paths.indexOf(this.paths.length) == -1);
      this.merges = this.merges.filter(s => s.paths.indexOf(this.paths.length) == -1);
    }
    switchedCars.forEach(car => {
      this.paths[car.p].cars.unshift(car);
      this.paths[car.p].cars.sort((a, b) => (a.x - b.x));
      //this.paths.forEach(path => console.log(path.cars.map(car => Math.floor(car.x))));
    });
  }

  pushCar(car, pathId, s)
  {
    car.x = s;
    car.p = pathId;
    this.paths[pathId].cars.push(car);
    this.paths[pathId].cars.sort((a, b) => (a.x - b.x))
  }
}
