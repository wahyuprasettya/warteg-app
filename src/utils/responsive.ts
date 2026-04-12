export const BREAKPOINTS = {
  compact: 390,
  tablet: 768,
  wide: 1024,
} as const;

export const getResponsiveLayout = (width: number) => {
  const isCompact = width < BREAKPOINTS.compact;
  const isTablet = width >= BREAKPOINTS.tablet;
  const isWide = width >= BREAKPOINTS.wide;

  return {
    isCompact,
    isTablet,
    isWide,
    horizontalPadding: isCompact ? 14 : isTablet ? 24 : 16,
    contentMaxWidth: isWide ? 1120 : isTablet ? 960 : undefined,
    pageGap: isTablet ? 20 : 16,
    titleSize: isWide ? 32 : isTablet ? 28 : isCompact ? 24 : 26,
    subtitleSize: isTablet ? 15 : 14,
  };
};

export const getGridColumns = (
  width: number,
  options: { compact?: number; tablet?: number; wide?: number } = {},
) => {
  const compact = options.compact ?? 2;
  const tablet = options.tablet ?? 3;
  const wide = options.wide ?? 4;

  if (width >= BREAKPOINTS.wide) return wide;
  if (width >= BREAKPOINTS.tablet) return tablet;
  return compact;
};
