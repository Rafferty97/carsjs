export default class Spline
{
  constructor(a, b, c, d, l)
  {
    const l2 = Math.pow(l, 2), l3 = Math.pow(l, 3), l4 = Math.pow(l, 4);
    const ca = -((2*l*((b-a)-c*l) -l2*(d-c))/l4);
    const cb = -((l3*(d-c) -3*l2*((b-a)-c*l))/l4);
    this.coeffs = [ca, cb, c, a];
  }

  y(x)
  {
    const [a, b, c, d] = this.coeffs;
    const x2 = Math.pow(x, 2), x3 = Math.pow(x, 3);
    return a*x3 + b*x2 + c*x + d;
  }

  yd(x)
  {
    const [a, b, c, d] = this.coeffs;
    const x2 = Math.pow(x, 2);
    return 3*a*x2 + 2*b*x + c;
  }
}
