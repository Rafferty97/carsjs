import Track from './track';
import Lane from './lane';
import Spline, { SplineCP } from './spline';
import Curve from './curve/curve';

export default class Road
{
  curve: Curve;
  tracks: Track[];

  constructor(curve: Curve, x1: number, x2: number, lanesForward: number[], lanesBack: number[])
  {
    this.curve = curve;
    this.tracks = [];
    let lanes = [];
    for (let i=0; i<lanesForward.length; i++) {
      if (i != 0) {
        const y = 0.5 * (lanesForward[i] + lanesForward[i - 1]);
        lanes.push(new Lane(Spline.Constant(y, 0, 10), true));
      }
      lanes.push(new Lane(Spline.Constant(lanesForward[i], 0, 10)));
    }
    this.tracks.push(new Track(curve, x1, x2, lanes));
    lanes = [];
    for (let i=0; i<lanesBack.length; i++) {
      if (i != 0) {
        const y = 0.5 * (lanesBack[i] + lanesBack[i - 1]);
        lanes.push(new Lane(Spline.Constant(y, 0, 10), true));
      }
      lanes.push(new Lane(Spline.Constant(lanesBack[i], 0, 10)));
    }
    this.tracks.push(new Track(curve.reverse(), curve.length - x2, curve.length - x1, lanes));
  }

  resetConditions()
  {
    this.tracks.forEach(track => track.resetConditions());
  }

  calculateConditions()
  {
    this.tracks.forEach(track => track.calculateConditions());
  }

  step(delta: number)
  {
    this.tracks.forEach(track => track.step(delta));
  }
}