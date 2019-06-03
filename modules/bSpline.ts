export default function interpolate(
  t: number,
  degree: number,
  points: Array<[number, number]>,
  closed: boolean = false,
  knots?: number[],
  weights?: number[],
  result?: number[][] | number[]
) {
  let pts: Array<[number, number]> = [...points];
  if (closed) {
    pts = [...points, ...points.slice(0, Math.min(t, points.length))];
  } else {
    for (let temp = 0; temp < Math.floor(t); temp++) {
      pts.unshift(pts[0]);
      pts.push(pts[pts.length - 1]);
    }
  }

  let i: number;
  let j: number;
  let s: number;
  let l: number; // function-scoped iteration variables
  const n = pts.length; // points count
  const d = pts[0].length; // point dimensionality

  if (degree < 1) throw new Error('degree must be at least 1 (linear)');
  if (degree > n - 1) {
    throw new Error('degree must be less than or equal to point count - 1');
  }

  if (!weights) {
    // build weight vector of length [n]
    weights = [];
    for (i = 0; i < n; i++) {
      weights[i] = 1;
    }
  }

  if (!knots) {
    // build knot vector of length [n + degree + 1]
    knots = [];
    for (i = 0; i < n + degree + 1; i++) {
      knots[i] = i;
    }
  } else {
    if (knots.length !== n + degree + 1) {
      throw new Error('bad knot vector length');
    }
  }

  const domain = [degree, knots.length - 1 - degree];

  // remap t to the domain where the spline is defined
  const low = knots[domain[0]];
  const high = knots[domain[1]];
  t = t * (high - low) + low;

  if (t < low || t > high) throw new Error('out of bounds');

  // find s (the spline segment) for the [t] value provided
  for (s = domain[0]; s < domain[1]; s++) {
    if (t >= knots[s] && t <= knots[s + 1]) {
      break;
    }
  }

  // convert points to homogeneous coordinates
  const v: number[][] = [];
  for (i = 0; i < n; i++) {
    v[i] = [];
    for (j = 0; j < d; j++) {
      v[i][j] = pts[i][j] * weights[i];
    }
    v[i][d] = weights[i];
  }

  // l (level) goes from 1 to the curve degree + 1
  let alpha;
  for (l = 1; l <= degree + 1; l++) {
    // build level l of the pyramid
    for (i = s; i > s - degree - 1 + l; i--) {
      alpha = (t - knots[i]) / (knots[i + degree + 1 - l] - knots[i]);

      // interpolate each component
      for (j = 0; j < d + 1; j++) {
        v[i][j] = (1 - alpha) * v[i - 1][j] + alpha * v[i][j];
      }
    }
  }

  // convert back to cartesian and return
  result = result || [];
  for (i = 0; i < d; i++) {
    result[i] = v[s][i] / v[s][d];
  }

  return result as [number, number];
}
