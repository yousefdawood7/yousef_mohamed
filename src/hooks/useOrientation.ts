import { useWindowDimensions } from 'react-native';

/**
 * Responsive orientation + size helpers shared across screens.
 * Recomputes on every rotation via useWindowDimensions.
 */
export function useOrientation() {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 850;
  const isLandscape = width > height;
  // Landscape on a phone (narrow height): the most constrained case.
  const isCompactLandscape = isLandscape && !isTablet;

  return { width, height, isTablet, isLandscape, isCompactLandscape };
}
