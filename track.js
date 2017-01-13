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
    getLanesIn(index) {
        return this.tracksIn.map(({ t, l }) => l[index].map(i => t.lanes[i])).reduce((c, a) => c.concat(a), []);
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
    applyMergeCondition(cars, x1, x2, lanes) {
        cars.forEach((car, i) => {
            if (lanes.indexOf(car.lane) == -1)
                return;
            if (car.bc.rx > x2)
                return;
            const mergeCond = {
                type: 'merge', coord: 'track', x: car.bc.rx, v: car.bc.v, mx: x1
            };
            if (i == 0) {
                lanes.forEach(lane => {
                    if (lane == car.lane)
                        return;
                    lane.propagateCondition(mergeCond, car.bc.x, 500, 1);
                });
            }
            else {
                cars[i - 1].conditions.push(mergeCond);
            }
        });
    }
    calculateConditions() {
        this.lanes.forEach(lane => lane.calculateConditions());
        let cars = [];
        this.lanes.forEach(lane => cars = cars.concat(lane.cars));
        cars = cars.sort((a, b) => (a.bc.x - b.bc.x));
        this.mergedLanes.forEach(ml => {
            this.applyMergeCondition(cars, ml.x1, ml.x2, ml.lanes);
        });
    }
    step(dt) {
        this.lanes.forEach(lane => lane.step(dt));
    }
    addMergeSection(lanes, start, end) {
        this.mergedLanes.push({
            lanes: lanes.map(i => this.lanes[i]),
            x1: start,
            x2: end
        });
    }
}
