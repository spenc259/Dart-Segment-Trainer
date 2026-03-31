const boardOrder = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const polarToCartesian = (radius: number, angleInDegrees: number) => {
  const radians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: 160 + radius * Math.cos(radians),
    y: 160 + radius * Math.sin(radians),
  };
};

const describeWedge = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
  const outerStart = polarToCartesian(outerRadius, startAngle);
  const outerEnd = polarToCartesian(outerRadius, endAngle);
  const innerEnd = polarToCartesian(innerRadius, endAngle);
  const innerStart = polarToCartesian(innerRadius, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
};

interface DartboardOutlineProps {
  targetSegment: number;
}

export function DartboardOutline({ targetSegment }: DartboardOutlineProps) {
  const targetIndex = boardOrder.indexOf(targetSegment);
  const segmentAngle = 360 / boardOrder.length;
  const startAngle = targetIndex * segmentAngle;
  const endAngle = startAngle + segmentAngle;

  return (
    <svg
      className="dartboard-outline"
      viewBox="0 0 320 320"
      role="img"
      aria-label={`Outline dartboard highlighting segment ${targetSegment}`}
    >
      <title>Dartboard outline</title>
      <path
        d={describeWedge(startAngle, endAngle, 92, 146)}
        className="dartboard-highlight"
      />
      <circle cx="160" cy="160" r="146" className="dartboard-ring" />
      <circle cx="160" cy="160" r="122" className="dartboard-ring" />
      <circle cx="160" cy="160" r="92" className="dartboard-ring" />
      <circle cx="160" cy="160" r="68" className="dartboard-ring" />
      <circle cx="160" cy="160" r="22" className="dartboard-ring" />
      <circle cx="160" cy="160" r="8" className="dartboard-ring" />

      {boardOrder.map((segment, index) => {
        const angle = index * segmentAngle;
        const spoke = polarToCartesian(146, angle);
        const labelPoint = polarToCartesian(157, angle + segmentAngle / 2);

        return (
          <g key={segment}>
            <line
              x1="160"
              y1="160"
              x2={spoke.x}
              y2={spoke.y}
              className="dartboard-spoke"
            />
            <text
              x={labelPoint.x}
              y={labelPoint.y}
              className={`dartboard-label ${segment === targetSegment ? "is-target" : ""}`}
            >
              {segment}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
