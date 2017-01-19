import Track from './track';
import Spline from './spline';
import PolyLine from './polyline';
import Car, { LCDirection } from './car';

export default class Lane
{
  parent: Track;
  index: number;
  latSpline: Spline;
  arcSpline: PolyLine;
  _length: number;
  cars: Car[];
  lc: boolean;

  constructor(latSpline: Spline, laneChange: boolean = false)
  {
    this.parent = null;
    this.latSpline = latSpline;
    this.arcSpline = null;
    this._length = 0;
    this.cars = [];
    this.lc = laneChange;
  }

  get length()
  {
    return this._length;
  }

  setParent(track: Track, index: number)
  {
    this.parent = track;
    this.index = index;
    this.arcSpline = PolyLine.createArcLengthMap(
      this.getXYfromBaseX.bind(this),
      0, this.parent.length, 1);
    this._length = this.arcSpline.X(this.parent.length);
  }

  getXYA(s: number)
  {
    const t = this.arcSpline.Y(s);
    const l = this.latSpline.YdY(t);
    return this.parent.getXYA(t, l.y, l.dydx);
  }

  getXYfromBaseX(b: number)
  {
    const l = this.latSpline.Y(b);
    return this.parent.getXY(b, l);
  }

  getXYAfromBaseX(b: number, t: number = 0, dt: number = 0)
  {
    const l = this.latSpline.YdY(b);
    return this.parent.getXYA(b, l.y + t, l.dydx + dt);
  }

  getLdL(b: number)
  {
    const { y, dydx } = this.latSpline.YdY(b);
    return { l: y, dl: dydx };
  }

  getBaseCoords(s: number, v: number, ...otherx: number[])
  {
    const { y, dydx } = this.arcSpline.YdY(s);
    return { x: y, v: dydx * v, ox: otherx.map(s => this.arcSpline.Y(s)) };
  }

  getLaneCoords(s: number, v: number, ...otherx: number[])
  {
    const { x, dxdy } = this.arcSpline.XdX(s);
    return { x: x, v: dxdy * v, ox: otherx.map(s => this.arcSpline.X(s)) };
  }

  getNeighbour(direction: LCDirection)
  {
    const nullobj = { mid: null, targ: null };
    const d = direction == LCDirection.Right ? -1 : 1;
    if (d == -1 && this.index == 0) return nullobj;
    if (d == 1 && this.index == this.parent.lanes.length - 1) return nullobj;
    if (!this.parent.lanes[this.index + d].lc) return nullobj;
    return {
      mid: this.parent.lanes[this.index + d],
      targ: this.parent.lanes[this.index + 2 * d]
    };
  }

  addCar(car: Car)
  {
    this.cars.unshift(car);
    this.cars.sort((a, b) => (a.x - b.x));
  }

  removeCar(car: Car)
  {
    this.cars = this.cars.filter(_car => _car != car);
  }

  resetConditions()
  {
    this.cars.forEach(car => car.resetConditions());
  }

  get lanesIn()
  {
    return this.parent.getLanesIn(this.index);
  }

  get lanesOut()
  {
    return this.parent.getLanesOut(this.index);
  }

  calculateConditions()
  {
    this.cars.forEach((car, i) => {
      const follower = i == 0 ? null : this.cars[i - 1];
      const leader = i == this.cars.length - 1 ? null : this.cars[i + 1];
      // Car-following model
      const followCond = { type: 'car', coords: 'lane', x: car.rx, v: car.v };
      if (follower) {
        follower.conditions.push(followCond);
      } else {
        this.lanesIn.forEach(lane => lane.propagateCondition(followCond, car.x, 500, 1));
      }
      // Speed limit
      car.conditions.push({ type: 'speed', v: 60 / 3.6 });
      // End of lane
      if (this.lanesOut.length == 0) {
        car.conditions.push({ type: 'stop', x: this.length, coord: 'lane' });
      }
    });
  }

  propagateCondition(_cond: any, _x: number, lim: number, depth: number = 1)
  {
    if (_x > lim) return;
    const coord = _cond.coord;
    const dx = (coord == 'track' ? this.parent.length : this.length);
    const x = _x + dx;
    const cond = Object.assign({}, _cond);
    if (cond.hasOwnProperty('x')) cond.x += dx;
    if (cond.hasOwnProperty('mx')) cond.mx += dx;
    if (cond.hasOwnProperty('r')) cond.r.unshift(this); else cond.r = [this];
    for (let i=this.cars.length-1; i>=0; i--) {
      const car = this.cars[i];
      car.conditions.push(cond);
      depth--;
      if (depth == 0) return;
    }
    this.parent.getLanesIn(this.index).forEach(lane => {
      lane.propagateCondition(cond, x, lim, depth);
    });
  }

  step(dt: number)
  {
    this.cars.forEach(car => car.step(dt));
  }

  drawLine(s: number, ctx)
  {
    const c = this.latSpline.Y(s);
    this.parent.curve.drawLine(s, ctx, c - 2, c + 2);
  }

  incomingCars(x: number, coord: string, lim: number = 200)
  {
    const _this = this;
    let ind = x >= 0 ? this.cars.length - 1 : -1;
    while (ind >= 0) {
      const car = this.cars[ind];
      if ((coord == 'track' ? car.bc.fx : car.fx) < x) break;
      ind--;
    }
    let prevIt = null, j = 0;
    return {
      [Symbol.iterator]() {
        return {
          next() {
            if (ind == -1) {
              if (x - lim >= 0) return { value: null, done: true };
              if (prevIt == null) {
                prevIt = [];
                _this.lanesIn.forEach(lane => {
                  const len = coord == 'track' ? lane.parent.length : lane.length;
                  prevIt.push(lane.incomingCars(x + len, coord, lim)[Symbol.iterator]());
                });
              }
              if (prevIt.length == 0) return { value: null, done: true };
              let t = -1;
              for (let jj = j; jj != t; jj = (jj + 1) % prevIt.length) {
                t = j;
                const obj = prevIt[jj].next();
                if (obj.done) continue;
                j = jj;
                return obj;
              }
              return { value: null, done: true };
            }
            const car = _this.cars[ind];
            if ((coord == 'track' ? car.bc.fx : car.fx) < x - lim) return { value: null, done: true };
            ind--;
            return {
              value: { car, x },
              done: false
            };
          }
        };
      }
    };
  }
}