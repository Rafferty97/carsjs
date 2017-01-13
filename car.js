const BREAK_FACTOR = 1.5;
const CAR_GAP = 2;
export default class Car {
    constructor(lane, x = 0, v = 0) {
        this.maxacc = 2;
        this.comfdec = 3;
        this.maxdec = 10;
        this.timegap = 2;
        this.l = 5;
        this.w = 2;
        this.x = x;
        this.v = v;
        this.lane = lane;
        lane.addCar(this);
        this.recalcBaseCoords();
    }
    get rx() { return this.x - (this.l / 2); }
    get fx() { return this.x + (this.l / 2); }
    XYA() {
        return this.lane.getXYAfromBaseX(this.bc.x);
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
            case 'amber': {
                const stopdist = 0.5 * v * (v / (this.comfdec * BREAK_FACTOR));
                if (stopdist > cond.x - fx)
                    break;
            }
            case 'stop': {
                const ss = CAR_GAP + ((v * v) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
                return this.maxacc * (1 - Math.pow(ss / (cond.x - fx), 2));
            }
            case 'merge': {
                /*const MERGE_EASE_FACTOR = 2;
                const mdo = cond.mp - rx, md = cond.mp - cond.x;
                let a = this.maxacc;
                // Smooth merge
                const ss = CAR_GAP + (v * this.timegap) + ((v * (v - cond.v)) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
                let dec = -1000;
                if (cond.v > 0 && mdo > 0) {
                  dec = (mdo + cond.x - ss - x) / Math.pow(mdo / cond.v, 2);
                  dec -= v / (mdo / cond.v);
                  dec *= MERGE_EASE_FACTOR;
                }
                // Should overtake?
                //const mdtm = (dtm + (fx - x) + this.len);
                //const ttm = (dtm / Math.max(fv, 0.01)) - MERGE_OVERTAKE_TIME_SAFETY;
                //if (!ot || (ttm * (v + 0.5*ma*ttm) < mdtm)) {
                if (x > cond.sp) {
                  a = Math.max(dec, this.maxacc * (1 - Math.pow(ss / (cond.x - fx), 2)));
                }
                // Match lane speed
                if (md > 0) {
                  const speed = Math.sqrt((cond.v * cond.v) + 2 * this.comfdec * md);
                  a = Math.min(a, this.maxacc * (1 - Math.pow(v / speed, 4)));
                }
                return a;*/
                const ss1 = CAR_GAP + ((v * v) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
                const a1 = ss1 / Math.max(cond.mx - fx, 0.01);
                const ss2 = CAR_GAP + (v * this.timegap) + ((v * (v - cond.v)) / (2 * Math.sqrt(this.maxacc * this.comfdec)));
                const a2 = ss2 / Math.max(cond.x - fx, 0.01);
                return this.maxacc * (1 - Math.pow(Math.min(a1, a2), 2));
            }
            case 'diverge': {
                //this.track.curve.drawLine(fx, this.ctx);
                return this.maxacc * cond.e;
            }
        }
        return this.maxacc;
    }
    /* changeLane(newLane: Track, dist: number)
    {
      const start = this.track.baseSLdL(this.x);
      const end = newLane.trackSLdL(start.s + dist);
      const cl = this.track.curve.length;
      const lcSpline = new Spline([
        { x: start.s, y: start.l, dydx: start.dlds },
        { x: start.s + dist, y: end.l, dydx: end.dlds }
        ]);
      const lcTrack = new Track(this.track.curve, lcSpline, false);
      this.x = 0;
      this.changingLanes = true;
      this.lc_destTrack = newLane;
      this.lc_srcTrack = this.track;
      this.lc_destX = end.s;
      this.track.changeCarLC(this);
      newLane.addCar(this);
      this.track = lcTrack;
    } */
    resetConditions() {
        this.conditions = [];
    }
    get bc() {
        return this._bc;
    }
    recalcBaseCoords() {
        const { x, v, ox } = this.lane.getBaseCoords(this.x, this.v, this.fx, this.rx);
        this._bc = { x, v, fx: ox[0], rx: ox[1] };
    }
    step(dt) {
        let a = this.maxacc;
        // Calculate acceleration
        const conds = this.conditions;
        /* if (this.changingLanes) {
          conds = this.lc_srcTrack.getConditions(this) || [];
          conds = conds.concat(this.lc_destTrack.getConditions(this) || []);
        } */
        conds.push({ type: 'speed', v: 60 / 3.6 });
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
        // Connect to next track
        if (this.x > this.lane.length) {
            const lanesOut = this.lane.lanesOut;
            if (lanesOut.length == 0) {
                this.x = this.lane.length;
                this.v = 0;
            }
            else {
                this.lane.removeCar(this);
                this.x -= this.lane.length;
                this.lane = lanesOut[Math.floor(lanesOut.length * Math.random())];
                this.lane.addCar(this);
            }
        }
        // Recalculate base coordinates
        this.recalcBaseCoords();
    }
}
