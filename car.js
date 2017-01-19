import Spline from './spline';
const BREAK_FACTOR = 1.5;
const CAR_GAP = 2;
const MERGE_OVERTAKE_TIME = 2;
const MERGE_OVERTAKE_DIST = 30;
export var LCDirection;
(function (LCDirection) {
    LCDirection[LCDirection["Left"] = 0] = "Left";
    LCDirection[LCDirection["Right"] = 1] = "Right";
})(LCDirection || (LCDirection = {}));
;
export default class Car {
    constructor(lane, x = 0, v = 0) {
        this.maxacc = 2 + Math.random();
        this.comfdec = 3;
        this.maxdec = 10;
        this.timegap = 2 + Math.random();
        this.l = 5; //[4, 4.5, 5, 5, 5, 5, 5.5, 5.5, 10, 11][Math.floor(10 * Math.random())];
        this.w = 2;
        this.x = x;
        this.v = v;
        this.t = 0;
        this.dt = 0;
        this.lane = lane;
        this.targ = null;
        this.lcdir = 0;
        lane.addCar(this);
        this._bc_valid = false;
    }
    get rx() { return this.x - (this.l / 2); }
    get fx() { return this.x + (this.l / 2); }
    XY() {
        return this.XYA().p;
    }
    XYA() {
        return this.lane.getXYAfromBaseX(this.bc.x, this.t, this.dt);
    }
    testAmber(x, coord) {
        const { v, fx } = coord == 'track' ? this.bc : this;
        const stopdist = CAR_GAP + (0.5 * v * (v / (this.comfdec * BREAK_FACTOR)));
        return stopdist < x - fx;
    }
    calcCondAcc(cond, x, fx, rx, v) {
        switch (cond.type) {
            case 'speed': {
                return this.maxacc * (1 - Math.pow(v / cond.v, 4));
            }
            case 'car': {
                if (fx > cond.x)
                    return -1000;
                const ss = CAR_GAP + (v * this.timegap) + ((v * (v - cond.v)) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
                return this.maxacc * (1 - Math.pow(ss / (cond.x - fx), 2));
            }
            case 'stop': {
                const ss = CAR_GAP + ((v * v) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
                return this.maxacc * (1 - Math.pow(ss / (cond.x - fx), 2));
            }
            case 'merge': {
                // Follow car acceleration
                const ss2 = CAR_GAP + (v * this.timegap) + ((v * (v - cond.v)) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
                const a2 = this.maxacc * (1 - Math.pow(ss2 / Math.max(cond.x - fx, 0.01), 2));
                if (cond.x >= cond.mx)
                    return a2;
                // End of merge point acceleration
                const ss1 = CAR_GAP + ((v * v) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
                const a1 = this.maxacc * (1 - Math.pow(ss1 / Math.max(cond.mx - fx, 0.01), 2));
                // Calculate if should overtake
                const overtake = ((cond.mx - cond.x) - MERGE_OVERTAKE_DIST) > MERGE_OVERTAKE_TIME * cond.v;
                if (overtake)
                    return Math.max(a2, a1);
                // Smooth merge acceleration
                const ttmr = Math.max(cond.v, 0.01) / (cond.mx - cond.x);
                const dtm = (cond.mx - ss2) - fx;
                const a3 = 2 * ttmr * ((dtm * ttmr) - v);
                // Return acceleration
                return Math.max(a2, Math.min(a1, a3));
            }
            case 'diverge': {
                //this.track.curve.drawLine(fx, this.ctx);
                return this.maxacc * cond.e;
            }
        }
        return this.maxacc;
    }
    changeLanes(direction) {
        if (this.lane.lc)
            return;
        const { mid, targ } = this.lane.getNeighbour(direction);
        if (!targ)
            return;
        const bc = this.bc;
        const oldLdL = this.lane.getLdL(this.bc.x);
        this.t += oldLdL.l;
        this.dt += oldLdL.dl;
        this.lane.removeCar(this);
        this.lane = mid;
        this.targ = targ;
        const { x, v } = this.lane.getLaneCoords(bc.x, bc.v);
        this.x = x;
        this.v = v;
        const newLdL = this.lane.getLdL(this.bc.x);
        this.t -= newLdL.l;
        this.dt -= newLdL.dl;
        this.calcLatSpline(40);
        this.lane.addCar(this);
        this.lcdir = direction == LCDirection.Left ? 1 : -1;
    }
    resetConditions() {
        this.conditions = [];
    }
    get bc() {
        if (!this._bc_valid)
            this.recalcBaseCoords();
        return this._bc;
    }
    recalcBaseCoords() {
        const { x, v, ox } = this.lane.getBaseCoords(this.x, this.v, this.fx, this.rx);
        this._bc = { x, v, fx: ox[0], rx: ox[1] };
        this._bc_valid = true;
    }
    calcLatSpline(dist) {
        if (!this.lane.lc)
            return;
        const d = this.targ.getLdL(this.bc.x + dist);
        const m = this.lane.getLdL(this.bc.x + dist);
        this.lcspline = new Spline([
            { x: this.bc.x, y: this.t, dydx: this.dt },
            { x: this.bc.x + dist, y: (d.l - m.l), dydx: (d.dl - m.dl) }
        ]);
    }
    step(dt) {
        let a = this.maxacc;
        // Calculate acceleration
        const conds = this.conditions;
        /* if (this.changingLanes) {
          conds = this.lc_srcTrack.getConditions(this) || [];
          conds = conds.concat(this.lc_destTrack.getConditions(this) || []);
        } */
        conds.forEach(cond => {
            let c = cond.coord == 'track' ? this.bc : this;
            a = Math.min(a, this.calcCondAcc(cond, c.x, c.fx, c.rx, c.v));
        });
        // Integrate
        if (a < -this.maxdec)
            a = -this.maxdec;
        this.v += a * dt;
        if (this.v < 0)
            this.v = 0;
        this.x += this.v * dt;
        this._bc_valid = false;
        // Lane change lateral position
        if (this.targ != null) {
            if (this.bc.x >= this.lcspline.x2) {
                this.lane.removeCar(this);
                this.lane = this.targ;
                this.lane.addCar(this);
                this.targ = null;
                this.lcdir = 0;
                const { x, v } = this.lane.getLaneCoords(this.bc.x, this.bc.v);
                this.x = x;
                this.v = v;
                this.t = 0;
                this.dt = 0;
                this._bc_valid = false;
            }
            else {
                const nl = this.lcspline.YdY(this.bc.x);
                this.t = nl.y;
                this.dt = nl.dydx;
            }
        }
        // Connect to next track
        if (this.x > this.lane.length) {
            const lanesOut = this.lane.lanesOut;
            if (lanesOut.length == 0) {
                this.x = this.lane.length;
                this.v = 0;
                this._bc_valid = false;
            }
            else {
                const dist = this.lane.lc ? (this.lcspline.x2 - this.bc.x) : 0;
                this.lane.removeCar(this);
                this.x -= this.lane.length;
                this._bc_valid = false;
                this.lane = lanesOut[Math.floor(lanesOut.length * Math.random())];
                this.lane.addCar(this);
                this.calcLatSpline(dist);
            }
        }
    }
}
