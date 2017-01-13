import Track from './track';
import Spline from './spline';
import PolyLine from './polyline';
import Car from './car';

export default class Lane
{
  parent: Track;
  index: number;
  latSpline: Spline;
  arcSpline: PolyLine;
  _length: number;
  cars: Car[];

  constructor(latSpline: Spline)
  {
    this.parent = null;
    this.latSpline = latSpline;
    this.arcSpline = null;
    this._length = 0;
    this.cars = [];
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

  getXYAfromBaseX(b: number)
  {
    const l = this.latSpline.YdY(b);
    return this.parent.getXYA(b, l.y, l.dydx);
  }

  getBaseCoords(s: number, v: number, ...otherx: number[])
  {
    const { y, dydx } = this.arcSpline.YdY(s);
    return { x: y, v: dydx * v, ox: otherx.map(s => this.arcSpline.Y(s)) };
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
}