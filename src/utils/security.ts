import { CabRoute, Employee } from '../types/dispatch';
import { DispatchType } from '../types/config';

export interface CabSecurityEvaluation {
  hasAllFemales: boolean;
  isFemaleFirstPickup: boolean;
  isFemaleLastDrop: boolean;
  requiresGuard: boolean;
  hasGuard: boolean;
  isCompliant: boolean;
  violationReason?: string;
  badgeLabel: string;
  badgeType: 'success' | 'warning' | 'neutral';
}

/**
 * Evaluates transport security & female safety compliance rules:
 * 1. If dispatch is Login (Pickup): first pickup must not be unescorted female.
 * 2. If dispatch is Logout (Drop): last drop-off must not be unescorted female.
 * 3. If all passengers in the cab are female: must have an escort guard assigned.
 * 4. If any of the above conditions are met without an escort guard, it flags a violation.
 */
export function evaluateCabSecurity(
  cab: CabRoute,
  dispatchType: DispatchType = 'pickup'
): CabSecurityEvaluation {
  const passengers = cab.passengers || [];

  if (passengers.length === 0) {
    return {
      hasAllFemales: false,
      isFemaleFirstPickup: false,
      isFemaleLastDrop: false,
      requiresGuard: false,
      hasGuard: !!cab.guard,
      isCompliant: true,
      badgeLabel: 'Empty Cab',
      badgeType: 'neutral',
    };
  }

  // Sort passengers by sequence (1, 2, 3...)
  const sorted = [...passengers].sort(
    (a, b) => (a.pickupSequence || 0) - (b.pickupSequence || 0)
  );

  const hasAllFemales = sorted.length > 0 && sorted.every((p) => p.gender === 'female');
  const firstPassenger = sorted[0];
  const lastPassenger = sorted[sorted.length - 1];

  const isFemaleFirstPickup =
    dispatchType === 'pickup' && firstPassenger?.gender === 'female';
  const isFemaleLastDrop =
    dispatchType === 'drop' && lastPassenger?.gender === 'female';

  const requiresGuard = hasAllFemales || isFemaleFirstPickup || isFemaleLastDrop;
  const hasGuard = !!cab.guard;
  const isCompliant = !requiresGuard || hasGuard;

  let violationReason: string | undefined;
  if (requiresGuard && !hasGuard) {
    if (hasAllFemales) {
      violationReason = 'All passengers are female; security escort guard required';
    } else if (isFemaleFirstPickup) {
      violationReason = 'First pickup (login) is a female employee; security escort guard required';
    } else if (isFemaleLastDrop) {
      violationReason = 'Last drop-off (logout) is a female employee; security escort guard required';
    }
  }

  let badgeLabel = 'Standard Cab';
  let badgeType: 'success' | 'warning' | 'neutral' = 'neutral';

  if (hasGuard) {
    badgeLabel = '🛡️ Escort Guard Assigned';
    badgeType = 'success';
  } else if (!isCompliant) {
    if (hasAllFemales) {
      badgeLabel = '⚠️ Missing Guard (All Female)';
    } else if (isFemaleFirstPickup) {
      badgeLabel = '⚠️ Missing Guard (Female 1st Pickup)';
    } else if (isFemaleLastDrop) {
      badgeLabel = '⚠️ Missing Guard (Female Last Drop)';
    } else {
      badgeLabel = '⚠️ Security Guard Required';
    }
    badgeType = 'warning';
  } else if (isFemaleFirstPickup) {
    badgeLabel = 'Female 1st Pickup (Safe)';
    badgeType = 'neutral';
  } else if (isFemaleLastDrop) {
    badgeLabel = 'Female Last Drop (Safe)';
    badgeType = 'neutral';
  }

  return {
    hasAllFemales,
    isFemaleFirstPickup,
    isFemaleLastDrop,
    requiresGuard,
    hasGuard,
    isCompliant,
    violationReason,
    badgeLabel,
    badgeType,
  };
}
