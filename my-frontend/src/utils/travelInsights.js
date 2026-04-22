function formatLagForTravel(lag, interval) {
  if (lag === 0) return "within the same period";
  return `after ~${lag} ${interval}${lag > 1 ? "s" : ""}`;
}

function getImpactStrength(correlation) {
  const abs = Math.abs(correlation);

  if (abs >= 0.5) return "High";
  if (abs >= 0.25) return "Moderate";
  return "Low";
}

export function generateTravelInsightCard({
  ticker,
  trend,
  correlation,
  lag,
  interval,
  category = "Airlines",
}) {
  const safeCategory = category || "Airlines";
  const safeTicker = ticker || "This indicator";

  if (correlation == null || lag == null) {
    return {
      title: safeCategory === "Health Impact"
        ? "Travel Health Insight"
        : "Travel Impact Insight",
      level: "Low",
      summary:
        "There is not enough data yet to identify a clear travel impact pattern for this period.",
      indicator: `${safeTicker} does not yet provide a reliable signal`,
      timing: "Unknown",
      trendText: trend || "Unknown",
      travellerMessage:
        "Use a wider date range or compare with another indicator before drawing conclusions.",
      actions: [
        "Try loading a longer outbreak period",
        "Compare another travel-related indicator",
        "Use this together with official travel advice",
      ],
    };
  }

  const timing = formatLagForTravel(lag, interval);
  const absCorrelation = Math.abs(correlation);

  const getImpactLevel = () => {
    if (absCorrelation >= 0.6) return "High";
    if (absCorrelation >= 0.3) return "Moderate";
    return "Low";
  };

  const level = getImpactLevel();

  if (safeCategory === "Airlines") {
    if (trend === "increasing" && correlation <= -0.5) {
      return {
        title: "Travel Impact Insight",
        level: "High",
        summary: `Airline signals suggest that rising outbreaks are being followed by weaker flight-related activity ${timing}. This points to a higher chance of travel disruption.`,
        indicator: `${safeTicker} is acting as a strong airline disruption signal`,
        timing,
        trendText: "Cases are increasing",
        travellerMessage:
          "Your trip may face more disruption risk if the outbreak continues to worsen.",
        actions: [
          "Check airline schedule changes before departure",
          "Allow extra flexibility for cancellations or delays",
          "Monitor official travel and airline updates closely",
        ],
      };
    }

    if (trend === "increasing" && correlation <= -0.3) {
      return {
        title: "Travel Impact Insight",
        level: "Moderate",
        summary: `Airline signals suggest that rising outbreaks may be followed by softer flight demand ${timing}. This may indicate some pressure on travel conditions.`,
        indicator: `${safeTicker} is showing a moderate airline disruption signal`,
        timing,
        trendText: "Cases are increasing",
        travellerMessage:
          "Travel is still possible, but conditions may become less stable if outbreaks continue rising.",
        actions: [
          "Check your route again closer to departure",
          "Watch for timetable or fare changes",
          "Keep track of local outbreak movement",
        ],
      };
    }

    if (trend === "decreasing" && correlation <= -0.3) {
      return {
        title: "Travel Impact Insight",
        level: "Moderate",
        summary: `Airline behaviour still shows sensitivity to outbreak changes ${timing}, but outbreak levels are now easing. This may suggest conditions are stabilising.`,
        indicator: `${safeTicker} shows a recovery-phase airline signal`,
        timing,
        trendText: "Cases are decreasing",
        travellerMessage:
          "Travel conditions may be improving, but some disruption effects can still linger.",
        actions: [
          "Keep monitoring route-specific updates",
          "Expect conditions to be more stable than during peak outbreak periods",
          "Use recent advisories to confirm risk is easing",
        ],
      };
    }

    return {
      title: "Travel Impact Insight",
      level,
      summary:
        "Airline signals are mixed, so there is no clear sign of major travel disruption in this outbreak window.",
      indicator: `${safeTicker} shows a mixed airline response`,
      timing,
      trendText:
        trend === "increasing"
          ? "Cases are increasing"
          : trend === "decreasing"
          ? "Cases are decreasing"
          : "Outbreak trend is unclear",
      travellerMessage:
        "Travel conditions appear relatively stable right now, but the signal is not strong enough to rule out changes.",
      actions: [
        "Use this result together with outbreak trends",
        "Check airline updates closer to departure",
        "Compare with other travel indicators if needed",
      ],
    };
  }

  if (safeCategory === "Tourism") {
    if (trend === "increasing" && correlation <= -0.5) {
      return {
        title: "Travel Impact Insight",
        level: "High",
        summary: `Tourism indicators suggest that rising outbreaks are being followed by weaker booking and travel activity ${timing}. This points to stronger disruption pressure on trips.`,
        indicator: `${safeTicker} is acting as a strong tourism demand signal`,
        timing,
        trendText: "Cases are increasing",
        travellerMessage:
          "Traveller confidence and booking activity may be dropping as outbreak pressure grows.",
        actions: [
          "Expect accommodation or demand conditions to shift",
          "Review cancellation flexibility before booking",
          "Watch for changes in local travel confidence",
        ],
      };
    }

    if (trend === "increasing" && correlation <= -0.3) {
      return {
        title: "Travel Impact Insight",
        level: "Moderate",
        summary: `Tourism indicators suggest that outbreak growth may be followed by softer travel and accommodation demand ${timing}.`,
        indicator: `${safeTicker} is showing a moderate tourism impact signal`,
        timing,
        trendText: "Cases are increasing",
        travellerMessage:
          "Travel demand may be weakening, which can signal a more cautious travel environment.",
        actions: [
          "Check accommodation policies carefully",
          "Monitor outbreak updates before finalising plans",
          "Be prepared for changing local conditions",
        ],
      };
    }

    if (trend === "decreasing" && correlation <= -0.3) {
      return {
        title: "Travel Impact Insight",
        level: "Moderate",
        summary: `Tourism indicators still reflect outbreak sensitivity ${timing}, but the outbreak trend is easing. This may suggest tourism conditions are recovering.`,
        indicator: `${safeTicker} shows a tourism recovery signal`,
        timing,
        trendText: "Cases are decreasing",
        travellerMessage:
          "Trip conditions may be improving, although recovery can take time after outbreak peaks.",
        actions: [
          "Recheck destination conditions before travelling",
          "Look for signs of recovery in tourism activity",
          "Use recent alerts to confirm improvement is continuing",
        ],
      };
    }

    return {
      title: "Travel Impact Insight",
      level,
      summary:
        "Tourism signals are mixed, so this outbreak window does not show a strong or consistent travel demand disruption pattern.",
      indicator: `${safeTicker} shows a mixed tourism response`,
      timing,
      trendText:
        trend === "increasing"
          ? "Cases are increasing"
          : trend === "decreasing"
          ? "Cases are decreasing"
          : "Outbreak trend is unclear",
      travellerMessage:
        "Travel demand appears fairly steady right now, but conditions should still be checked before departure.",
      actions: [
        "Review destination conditions closer to travel date",
        "Check accommodation flexibility",
        "Use this together with outbreak trend and alerts",
      ],
    };
  }

  if (safeCategory === "Health Impact") {
    if (trend === "increasing" && correlation >= 0.5) {
      return {
        title: "Travel Health Insight",
        level: "High",
        summary: `Health-related indicators suggest that rising outbreaks are being followed by stronger health-system pressure ${timing}. This can indicate a more difficult travel environment.`,
        indicator: `${safeTicker} is acting as a strong health pressure signal`,
        timing,
        trendText: "Cases are increasing",
        travellerMessage:
          "This destination may be entering a period where health conditions are becoming more strained for travellers.",
        actions: [
          "Review official health advisories before travel",
          "Consider whether the trip is essential",
          "Prepare for stricter health-related measures",
        ],
      };
    }

    if (trend === "increasing" && correlation >= 0.3) {
      return {
        title: "Travel Health Insight",
        level: "Moderate",
        summary: `Health-related indicators suggest that outbreak growth may be followed by increasing health pressure ${timing}.`,
        indicator: `${safeTicker} is showing a moderate health pressure signal`,
        timing,
        trendText: "Cases are increasing",
        travellerMessage:
          "Travellers should be more cautious, as health conditions may become less favourable if the outbreak worsens.",
        actions: [
          "Monitor destination health advice",
          "Check entry or health screening requirements",
          "Prepare for changing local health measures",
        ],
      };
    }

    if (trend === "decreasing" && correlation >= 0.3) {
      return {
        title: "Travel Health Insight",
        level: "Moderate",
        summary: `Health-related indicators still show a response ${timing}, but outbreak levels are now falling. This may suggest health pressure is beginning to ease.`,
        indicator: `${safeTicker} shows a health recovery signal`,
        timing,
        trendText: "Cases are decreasing",
        travellerMessage:
          "Health conditions may be improving, but travellers should still confirm that the situation is continuing to stabilise.",
        actions: [
          "Check the most recent health alerts",
          "Confirm any local requirements are easing",
          "Use updated destination guidance before departure",
        ],
      };
    }

    return {
      title: "Travel Health Insight",
      level,
      summary:
        "Health-related signals are mixed, so there is no strong sign of worsening travel health pressure in this outbreak window.",
      indicator: `${safeTicker} shows a mixed health response`,
      timing,
      trendText:
        trend === "increasing"
          ? "Cases are increasing"
          : trend === "decreasing"
          ? "Cases are decreasing"
          : "Outbreak trend is unclear",
      travellerMessage:
        "There is no clear sign of major health-system stress from this indicator alone, but travellers should still monitor official advice.",
      actions: [
        "Use this together with official health advisories",
        "Check destination rules before travelling",
        "Monitor case trends for sudden changes",
      ],
    };
  }

  return {
    title: "Travel Impact Insight",
    level,
    summary:
      "A measurable response was detected, but this category does not yet have a category-specific travel interpretation.",
    indicator: `${safeTicker} shows a measurable response`,
    timing,
    trendText:
      trend === "increasing"
        ? "Cases are increasing"
        : trend === "decreasing"
        ? "Cases are decreasing"
        : "Outbreak trend is unclear",
    travellerMessage:
      "Use this signal as supporting evidence rather than direct travel advice.",
    actions: [
      "Compare with a travel-specific category",
      "Check outbreak trend and official advisories",
      "Use additional indicators for stronger interpretation",
    ],
  };
}