export default class ConflictArea {
    constructor(roads) {
        this.lanes = [];
        this.lanes.push({ lane: roads[8].tracks[0].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[8].tracks[0].lanes[2], cars: [] });
        this.lanes.push({ lane: roads[8].tracks[1].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[8].tracks[1].lanes[2], cars: [] });
        this.lanes.push({ lane: roads[9].tracks[0].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[9].tracks[0].lanes[2], cars: [] });
        this.lanes.push({ lane: roads[9].tracks[1].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[9].tracks[1].lanes[2], cars: [] });
        this.lanes.push({ lane: roads[4].tracks[0].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[4].tracks[1].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[5].tracks[0].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[5].tracks[1].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[6].tracks[0].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[6].tracks[1].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[7].tracks[0].lanes[0], cars: [] });
        this.lanes.push({ lane: roads[7].tracks[1].lanes[0], cars: [] });
        this.t = 0;
        this.p = 0;
        this.conflictLanes = this.lanes.map(() => false);
    }
    resetConditions() {
        let recalc = false;
        this.lanes.forEach(l => {
            //l.cars = l.cars.filter(car => car.lane == l.lane);
            if (l.cars.length == 0)
                recalc = true;
        });
        if (recalc)
            this.recalcConflicts();
    }
    calculateConditions() {
        //console.log(this.conflictLanes.map(s => s ? 'X' : '-').join(''));
        //console.log(this.lanes.map(l => l.cars.length).join(' '));
        this.lanes.forEach(({ lane, cars }, i) => {
            if (lane == null)
                return;
            let scarx = null;
            for (const carx of lane.incomingCars(0, 'track')) {
                const { car, x } = carx;
                scarx = carx;
                // Is already proceeded through?
                if (cars.indexOf(car) != -1) {
                    scarx = null;
                    continue;
                }
                const state = 'green';
                // Is giveway or stop?
                if (car.bc.fx < x - 5)
                    break;
                // Is red/amber light?
                if (state == 'red')
                    break;
                if (state == 'amber' && car.testAmber(x, 'track'))
                    break;
                // Is another car conflicting?
                if (this.conflictLanes[i])
                    break;
                // Can you clear the intersection?
                // Is there a gap in traffic?
                // Should car proceed through?
                if (!car.testAmber(x, 'track')) {
                    cars.push(car);
                    this.addConflicts(i);
                }
                scarx = null;
            }
            if (scarx == null)
                return;
            if (cars.indexOf(scarx.car) != -1)
                return;
            scarx.car.conditions.push({
                coord: 'track', type: 'stop', x: scarx.x
            });
        });
    }
    addConflicts(lane) {
        const conflict = [
            "----XXXXX-XX----",
            "----XXXXX-XX----",
            "----XXXXX---XX-X",
            "----XXXXX---XX-X",
            "XXXX----XX-X-X-X",
            "XXXX----XX-X-X-X",
            "XXXX-------X-XXX",
            "XXXX-------X-XXX",
            "XXXXXX-----XXX--",
            "----XX-----X----",
            "XX--------------",
            "XX--XXXXXX-----X",
            "--XX----X------X",
            "--XXXXXXX-----XX",
            "--XX-------X----",
            "XXXX--XX--XX-X--"
        ];
        this.conflictLanes.forEach((cl, i) => {
            if (conflict[lane][i] == '-')
                return;
            this.conflictLanes[i] = true;
        });
    }
    recalcConflicts() {
        this.conflictLanes = this.lanes.map(() => false);
        this.lanes.forEach(({ lane, cars }, i) => {
            if (cars.length != 0)
                this.addConflicts(i);
        });
    }
    draw(ctx) {
        this.lanes.forEach(({ lane, cars }, i) => {
            const c = 'g';
            ctx.strokeStyle = c == 'r' ? 'red' : (c == 'g' ? 'green' : 'orange');
            lane.drawLine(lane.parent.x2, ctx);
        });
    }
}
