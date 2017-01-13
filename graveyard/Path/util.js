export function measureLength(s, steps)
{
  let l = 0;
  let p = s(0);
  for (let i=1; i<=steps; i++) {
    const t = i / steps;
    const np = s(t);
    l += Math.sqrt(Math.pow(np[0] - p[0], 2) + Math.pow(np[1] - p[1], 2));
    p = np;
  }
  return l;
}

export function rk4(x, v, a, dt) {
  // Returns final (position, velocity) array after time dt has passed.
  //        x: initial position
  //        v: initial velocity
  //        a: acceleration function a(x,v,dt) (must be callable)
  //        dt: timestep
  //return [x + v * dt, v + a(x, v, dt) * dt];

  var x1 = x;
  var v1 = v;
  var a1 = a(x1, v1, 0);

  var x2 = x + 0.5*v1*dt;
  var v2 = v + 0.5*a1*dt;
  var a2 = a(x2, v2, dt/2);

  var x3 = x + 0.5*v2*dt;
  var v3 = v + 0.5*a2*dt;
  var a3 = a(x3, v3, dt/2);

  var x4 = x + v3*dt;
  var v4 = v + a3*dt;
  var a4 = a(x4, v4, dt);

  var xf = x + (dt/6)*(v1 + 2*v2 + 2*v3 + v4);
  var vf = v + (dt/6)*(a1 + 2*a2 + 2*a3 + a4);

  return [xf, vf];
}
