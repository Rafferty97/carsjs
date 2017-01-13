import { getApproxArcLengthParam } from './util';
export default class Track {
    constructor(curve, latspline, reverse = false) {
        this.curve = reverse ? curve.reverse() : curve;
        this.latspline = latspline;
        this.tracksIn = [];
        this.tracksOut = [];
        this.cars = [];
        this.lc_cars = [];
        this.conditions = new Map();
        this.baseCoords = new Map();
        const steps = Math.floor(curve.length / 5);
        let { x1, x2 } = this.latspline;
        const alp = getApproxArcLengthParam(this._XY.bind(this), x1, x2, steps);
        this.len = alp.l;
        this.TfromS = alp.t;
        this.TfromSSpline = alp.s;
    }
    get length() { return this.len; }
    _XY(t) {
        return this.curve.XY(t, this.latspline.Y(t));
    }
    XY(s) {
        const t = this.TfromS(s);
        return this.curve.XY(t, this.latspline.Y(t));
    }
    angle(s) {
        const t = this.TfromS(s);
        let a = this.curve.angle(t, this.latspline.dYdX(t));
        return a;
    }
    baseSLdL(s) {
        const t = this.TfromS(s);
        return { s: t, l: this.latspline.Y(t), dlds: this.latspline.dYdX(t) };
    }
    trackSLdL(t) {
        const s = this.TfromSSpline.X(t, 0.01);
        return { s: s, l: this.latspline.Y(s), dlds: this.latspline.dYdX(s) };
    }
    baseFromTrack(s, dsdt = false) {
        if (s > this.length) {
            return { s: this.latspline.x2 + (s - this.length), dsdt: 1 };
        }
        if (s < 0) {
            return { s: this.latspline.x1 + s, dsdt: 1 };
        }
        const t = this.TfromS(s);
        return { s: t, dsdt: dsdt ? this.TfromSSpline.dYdX(s) : null };
    }
    addCar(car) {
        if (car.changingLanes) {
            this.lc_cars.push(car);
        }
        else {
            this.cars.push(car);
            this.cars.sort((a, b) => (a.x - b.x));
        }
    }
    removeCar(car) {
        let ind = this.cars.indexOf(car);
        if (ind != -1)
            this.cars.splice(ind, 1);
        ind = this.lc_cars.indexOf(car);
        if (ind != -1)
            this.lc_cars.splice(ind, 1);
    }
    changeCarLC(car) {
        this.removeCar(car);
        this.addCar(car);
    }
    clearConditions() {
        this.conditions.clear();
        const resetCar = car => {
            this.conditions.set(car, []);
            const { s, dsdt } = car.track.baseFromTrack(car.x, true);
            this.baseCoords.set(car, {
                x: s, sc: dsdt, v: car.v * dsdt,
                fx: car.track.baseFromTrack(car.fx).s,
                rx: car.track.baseFromTrack(car.rx).s,
                l: car.track.latspline.Y(s),
                dldt: car.track.latspline.dYdX(s) * car.v
            });
        };
        this.cars.forEach(resetCar);
        this.lc_cars.forEach(resetCar);
    }
    calculateConditions() {
        this.cars.forEach(car => {
            const bc = this.baseCoords.get(car);
            this.propogateBack(car.x, { type: 'car', x: car.rx, v: car.v, l: bc.l, dldt: bc.dldt }, 500);
        });
        this.lc_cars.forEach(car => {
            const bc = this.baseCoords.get(car);
            this.propogateBack(bc.x, {
                type: 'car',
                x: bc.rx,
                v: bc.v,
                l: bc.l,
                dldt: bc.dldt,
                coord: 'base'
            }, 500);
        });
    }
    mapCondToBaseCoords(cond) {
        if (cond.hasOwnProperty('coord') && cond.coord === 'base')
            return cond;
        if (!cond.hasOwnProperty('x'))
            return cond;
        const bc = this.baseFromTrack(cond.x, true);
        return Object.assign({}, cond, {
            x: bc.s,
            v: cond.v == null ? null : cond.v * bc.dsdt,
            coord: 'base'
        });
    }
    propogateBack(x, cond, lim, depth = 1) {
        if (cond.r && cond.r.length > 50)
            return;
        const condIsBase = cond.coord === 'base';
        let bcond = this.mapCondToBaseCoords(cond);
        const cx = condIsBase ? x : this.baseFromTrack(x).s;
        this.lc_cars.forEach(car => {
            const bc = this.baseCoords.get(car);
            if (bc.x >= cx - 0.05)
                return;
            this.conditions.get(car).push(bcond);
        });
        for (let i = this.cars.length - 1; i >= 0; i--) {
            const car = this.cars[i];
            const cx = !condIsBase ? car.x : this.baseCoords.get(car).x;
            if (cx >= x - 0.05)
                continue;
            this.conditions.get(car).push(cond);
            depth--;
            if (depth <= 0)
                return;
        }
        if (x - (condIsBase ? this.latspline.x1 : 0) > lim)
            return;
        this.tracksIn.forEach(track => {
            let tl = 0;
            if (condIsBase) {
                if (this.latspline.x1 <= track.latspline.x1)
                    tl = this.curve.length;
            }
            else
                tl = track.length;
            const ncond = Object.assign({}, cond, {
                x: cond.x == null ? null : cond.x + tl,
                mp: cond.x == null ? null : cond.mp + tl,
                sp: cond.x == null ? null : cond.sp + tl,
                r: ([this]).concat(cond.r || [])
            });
            track.propogateBack(x + tl, ncond, lim, depth);
        });
    }
    getConditions(car) {
        return this.conditions.get(car);
    }
    connectTo(track) {
        this.tracksOut.push(track);
        track.tracksIn.push(this);
    }
}
