import { bisectLeft, touches } from 'd3-array';

export const detectHoveredDatapointIndex = (ev, datetimes, timeScale, svgRef) => {
  if (!datetimes.length) return null;
  const dx = ev.pageX
    ? (ev.pageX - svgRef.current.getBoundingClientRect().left)
    : (touches(this)[0][0]);
  const datetime = timeScale.invert(dx);
  // Find data point closest to
  let i = bisectLeft(datetimes, datetime);
  if (i > 0 && datetime - datetimes[i - 1] < datetimes[i] - datetime) i -= 1;
  if (i > datetimes.length - 1) i = datetimes.length - 1;
  return i;
};

// If in mobile mode, put the tooltip to the top of the screen for
// readability, otherwise float it depending on the cursor position.
export const getTooltipPosition = (isMobile, marker) =>
  (isMobile ? { x: 0, y: 0 } : { x: marker.x - 7, y: marker.y - 7 });
