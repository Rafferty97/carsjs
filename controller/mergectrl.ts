import Track from '../track';
import Controller from './controller';

export default class MergeController extends Controller
{
  tracks: Track[];
  startx: number;
  endx: number;

  constructor(tracks: Track[], startx: number, endx: number)
  {
    super();
    this.tracks = tracks;
    this.startx = startx;
    this.endx = endx;
  }

  calculateConditions()
  {
    this.tracks.forEach(track => {
      const calcConds = car => {
        const bc = track.baseCoords.get(car);
        this.tracks.forEach(otrack => {
          if (track == otrack) return;
          otrack.propogateBack(bc.x, {
            type: 'merge',
            x: bc.rx,
            v: bc.v,
            mp: this.endx,
            sp: this.startx,
            coord: 'base'
          }, bc.rx - this.startx, 2);
        });
      };
      track.cars.forEach(calcConds);
      track.lc_cars.forEach(calcConds);
    });
  }
}