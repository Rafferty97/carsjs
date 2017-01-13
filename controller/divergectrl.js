import Controller from './controller';
export default class DivergeController extends Controller {
    constructor(tracks, startx, endx) {
        super();
        this.tracks = tracks;
        this.startx = startx;
        this.endx = endx;
    }
    static getDivergeCond(bc, startx, endx) {
        if (bc.rx > endx)
            return { type: 'null' };
        if (bc.rx > startx) {
            return {
                type: 'diverge',
                e: ((bc.rx - startx) / (endx - startx))
            };
        }
        return {
            type: 'car',
            x: bc.rx,
            v: bc.v,
            coord: 'base'
        };
    }
    calculateConditions() {
        this.tracks.forEach(track => {
            const calcConds = car => {
                const bc = track.baseCoords.get(car);
                const cond = DivergeController.getDivergeCond(bc, this.startx, this.endx);
                if (cond.type == 'null')
                    return;
                this.tracks.forEach(otrack => {
                    if (track == otrack)
                        return;
                    otrack.propogateBack(bc.x, cond, 0, 1);
                });
            };
            track.cars.forEach(calcConds);
            track.lc_cars.forEach(calcConds);
        });
    }
}
