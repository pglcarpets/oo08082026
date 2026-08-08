export function PlannerLayoutGraphic({ className = "" }: { className?: string }) {
  return (
    <div
      className={`home-planner-graphic shrink-0 rounded-huge border border-soft bg-hover ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 120"
        className="home-planner-graphic__svg max-h-24 max-w-32 text-primary"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="8"
          width="144"
          height="104"
          rx="4"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        <rect
          className="home-planner-graphic__room"
          x="20"
          y="20"
          width="52"
          height="36"
          rx="2"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />
        <rect
          className="home-planner-graphic__room home-planner-graphic__room--delay"
          x="88"
          y="20"
          width="52"
          height="36"
          rx="2"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />
        <rect
          className="home-planner-graphic__room home-planner-graphic__room--delay-2"
          x="20"
          y="68"
          width="120"
          height="32"
          rx="2"
          stroke="currentColor"
          strokeOpacity="0.75"
          strokeWidth="1.5"
        />
        <line
          x1="80"
          y1="20"
          x2="80"
          y2="100"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {[36, 56, 76, 96, 116].map((cx, index) => (
          <circle
            key={cx}
            cx={cx}
            cy="84"
            r="4"
            className="home-planner-graphic__dot"
            style={{ animationDelay: `${index * 0.15}s` }}
            fill="currentColor"
            fillOpacity="0.45"
          />
        ))}
      </svg>
    </div>
  );
}
