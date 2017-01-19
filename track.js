export default class Track {
    constructor(curve, x1, x2, lanes, reverse = false) {
        this.curve = reverse ? curve.reverse() : curve;
        this.x1 = x1;
        this.x2 = x2;
        this.lanes = lanes;
        this.lanes.forEach((lane, i) => lane.setParent(this, i));
        this.tracksIn = [];
        this.tracksOut = [];
        this.mergedLanes = [];
        this.mergedLanePairs = [];
        for (let i = 0; i < lanes.length; i++) {
            this.mergedLanePairs[i] = [];
            for (let j = 0; j < lanes.length; j++) {
                this.mergedLanePairs[i][j] = [];
            }
        }
    }
    connectTo(track, laneMapping) {
        const to = {
            t: track,
            l: this.lanes.map(() => [])
        };
        const ti = {
            t: this,
            l: track.lanes.map(() => [])
        };
        laneMapping.forEach(([l1, l2]) => {
            to.l[l1].push(l2);
            ti.l[l2].push(l1);
        });
        this.tracksOut.push(to);
        track.tracksIn.push(ti);
    }
    getLanesIn(index, withMergeLanes = false) {
        return this.tracksIn.map(({ t, l }) => {
            const lanes = l[index].map(i => t.lanes[i]);
            if (withMergeLanes) {
                t.mergedLanes.forEach(ml => {
                    for (let i = 0; i < ml.lanes.length; i++) {
                        if (lanes.indexOf(ml.lanes[i]) == -1)
                            continue;
                        ml.lanes.forEach(lane => {
                            if (lanes.indexOf(lane) == -1)
                                lanes.push(lane);
                        });
                        return;
                    }
                });
            }
            return lanes;
        }).reduce((c, a) => c.concat(a), []);
    }
    getLanesOut(index) {
        return this.tracksOut.map(({ t, l }) => l[index].map(i => t.lanes[i])).reduce((c, a) => c.concat(a), []);
    }
    getXY(s, l) {
        return this.curve.XY(this.x1 + s, l);
    }
    getXYA(s, l, dlds) {
        const p = this.curve.XY(this.x1 + s, l);
        const a = this.curve.angle(this.x1 + s, dlds);
        return { p, a };
    }
    get length() {
        return this.x2 - this.x1;
    }
    resetConditions() {
        this.lanes.forEach(lane => lane.resetConditions());
    }
    calcLCLanes(car, ind, lanes) {
        const lclanes = [];
        if (car.lane.lc) {
            lclanes.push(this.lanes[ind - 1]);
            lclanes.push(this.lanes[ind + 1]);
            if (ind - 2 >= 0 && this.lanes[ind - 2].lc)
                lclanes.push(this.lanes[ind - 2]);
            if (ind + 2 < this.lanes.length && this.lanes[ind + 2].lc)
                lclanes.push(this.lanes[ind + 2]);
        }
        else {
            if (ind - 1 >= 0 && this.lanes[ind - 1].lc)
                lclanes.push(this.lanes[ind - 1]);
            if (ind + 1 < this.lanes.length && this.lanes[ind + 1].lc)
                lclanes.push(this.lanes[ind + 1]);
        }
        lclanes.forEach(lane => lanes.set(lane, {
            type: 'merge', coord: 'track', x: car.bc.rx, v: car.bc.v, mx: 0
        }));
    }
    applyMergeCondition(cars) {
        cars.forEach((car, i) => {
            const lanes = new Map();
            const ind = car.lane.index;
            this.mergedLanePairs[ind].forEach((lms, j) => {
                let minx = Infinity;
                lms.forEach(lm => {
                    if (lm.x[2] < car.bc.rx)
                        return;
                    if (lm.x[1] < minx)
                        minx = lm.x[1];
                });
                if (minx == Infinity)
                    return;
                lanes.set(this.lanes[j], {
                    type: 'merge', coord: 'track', x: car.bc.rx, v: car.bc.v, mx: minx
                });
            });
            this.calcLCLanes(car, ind, lanes);
            for (let j = i + 1; j < cars.length; j++) {
                const ocar = cars[j];
                const cond = lanes.get(ocar.lane);
                if (cond == null)
                    continue;
                ocar.conditions.push(cond);
                lanes.delete(ocar.lane);
                if (lanes.size == 0)
                    break;
            }
            lanes.forEach((cond, lane) => {
                lane.lanesIn.forEach(laneIn => {
                    laneIn.propagateCondition(cond, car.bc.x, 500, 1);
                });
            });
        });
    }
    calculateConditions() {
        this.lanes.forEach(lane => lane.calculateConditions());
        let cars = [];
        this.lanes.forEach(lane => cars = cars.concat(lane.cars));
        cars = cars.sort((a, b) => (b.bc.x - a.bc.x));
        this.applyMergeCondition(cars);
    }
    step(dt) {
        this.lanes.forEach(lane => lane.step(dt));
    }
    addMergeSection(lanes, start, merge, diverge, end) {
        this.mergedLanes.push({
            lanes: lanes.map(i => this.lanes[i]),
            x: [start, merge, diverge, end]
        });
        for (let i = 0; i < lanes.length; i++)
            for (let j = 0; j < lanes.length; j++) {
                if (i == j)
                    continue;
                this.mergedLanePairs[lanes[i]][lanes[j]].push({ x: [start, merge, diverge, end] });
            }
    }
}
