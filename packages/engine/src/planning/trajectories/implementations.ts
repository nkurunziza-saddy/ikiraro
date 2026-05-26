import type { MotionDelta, ITrajectory } from "./types";
import { ZERO_DELTA } from "./types";

export class ArcTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    return {
      ...ZERO_DELTA,
      rArmXDelta: p * 0.34,
      rArmZDelta: p * 0.42,
      rForeYDelta: p * 0.28,
    };
  }
}

export class SaluteTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const wristWave = Math.sin(p * Math.PI) * 0.18;
    return {
      ...ZERO_DELTA,
      rArmXDelta: p * 0.03,
      rArmYDelta: p * -0.18,
      rArmZDelta: p * 0.66,
      rForeYDelta: p * 0.36,
      rHandZDelta: p * -0.2 + wristWave,
    };
  }
}

export class ForwardPushTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    return {
      ...ZERO_DELTA,
      rArmXDelta: p * 0.04,
      rArmZDelta: p * -0.62,
      rForeZDelta: p * 0.2,
      rHandXDelta: p * 0.08,
    };
  }
}

export class OutwardSweepTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    return {
      ...ZERO_DELTA,
      rArmXDelta: p * 0.08,
      rArmYDelta: p * -0.14,
      rArmZDelta: p * 0.58,
      rForeYDelta: p * 0.18,
    };
  }
}

export class WaveTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const wave = Math.sin(p * Math.PI * 6);
    return {
      ...ZERO_DELTA,
      rArmXDelta: 0.35 * wave,
      rArmYDelta: 0.45 * wave,
      rArmZDelta: 0.4 * wave,
      rForeZDelta: 0.45 * wave,
      rHandXDelta: -0.25 * wave,
      rHandYDelta: 0.25 * wave,
      rHandZDelta: 0.05 * wave,
    };
  }
}

export class CircleTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const theta = p * Math.PI * 2;
    return {
      ...ZERO_DELTA,
      rArmXDelta: Math.sin(theta) * -0.24,
      rArmZDelta: (1 - Math.cos(theta)) * 0.22,
    };
  }
}

export class TapTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const tap = Math.sin(p * Math.PI);
    return {
      ...ZERO_DELTA,
      rArmZDelta: tap * 0.22,
      rForeZDelta: tap * -0.18,
    };
  }
}

export class TwoHandTapTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const tap = Math.sin(p * Math.PI);
    return {
      ...ZERO_DELTA,
      rArmZDelta: tap * 0.28,
      lArmZDelta: -(tap * 0.28),
    };
  }
}

export class ShakeTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const shake = Math.sin(p * Math.PI * 4);
    return {
      ...ZERO_DELTA,
      rArmYDelta: shake * 0.18,
      rHandXDelta: shake * 0.12,
    };
  }
}

export class WristTwistTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const twist = Math.sin(p * Math.PI * 2);
    return {
      ...ZERO_DELTA,
      rHandYDelta: twist * 0.45,
      rHandZDelta: twist * 0.2,
    };
  }
}

export class PullBackTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    return {
      ...ZERO_DELTA,
      rArmXDelta: p * 0.06,
      rForeZDelta: p * 0.35,
    };
  }
}

export class ChestPatTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const pat = Math.abs(Math.sin(p * Math.PI));
    return {
      ...ZERO_DELTA,
      rArmZDelta: -(pat * 0.2),
      rForeZDelta: -(pat * 0.12),
    };
  }
}

export class MusicSweepTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const sweep = Math.sin(p * Math.PI * 2);
    return {
      ...ZERO_DELTA,
      rArmYDelta: sweep * 0.35,
      rForeYDelta: sweep * 0.28,
      rHandXDelta: Math.sin(p * Math.PI * 4) * 0.2,
    };
  }
}

export class GPushTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    return {
      ...ZERO_DELTA,
      rArmZDelta: p * -0.25,
      rArmXDelta: p * -0.08,
    };
  }
}

export class HSlideTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    return {
      ...ZERO_DELTA,
      rArmYDelta: p * -0.22,
    };
  }
}

export class DArcTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const theta = p * Math.PI;
    return {
      ...ZERO_DELTA,
      rArmXDelta: Math.sin(theta) * -0.18,
      rForeZDelta: (1 - Math.cos(theta)) * 0.22,
    };
  }
}

export class NDipTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const dip = Math.sin(p * Math.PI * 2);
    return {
      ...ZERO_DELTA,
      rArmXDelta: dip * 0.12,
      rForeYDelta: dip * 0.15,
    };
  }
}

export class JTraceTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    const theta = p * Math.PI;
    return {
      ...ZERO_DELTA,
      rArmXDelta: p * 0.15,
      rArmYDelta: Math.sin(theta) * -0.12,
      rHandZDelta: Math.sin(theta) * -0.2,
    };
  }
}

export class ZTraceTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    return {
      ...ZERO_DELTA,
      rArmYDelta: Math.sin(p * Math.PI * 3) * -0.22,
      rArmXDelta: (p - 0.5) * 0.12,
    };
  }
}

export class KPushTrajectory implements ITrajectory {
  evaluate(p: number): MotionDelta {
    return {
      ...ZERO_DELTA,
      rArmZDelta: p * -0.3,
      rForeZDelta: p * 0.18,
    };
  }
}
