const DEFAULT_WAITING_TIMES: Record<string, number> = {
  Council_Tax: 50,
  Housing_Benefit: 50,
  Homelessness: 100,
  Adults_Duty: 30,
  Childrens_Duty: 30,
  Community_Hub_Advisor: 30,
  General_Customer_Service: 10,
  Other: 30,
};

const WAIT_TIME_UPPER_BUFFER_MINUTES = 20;

export function getDefaultEstimatedWaitingTime(departmentName?: string | null) {
  return DEFAULT_WAITING_TIMES[departmentName ?? "Other"] ?? DEFAULT_WAITING_TIMES.Other;
}

export function getEstimatedWaitTimeBounds(position: number, estimatedWaitingTime: number) {
  const lower = Math.round(estimatedWaitingTime * position);

  return {
    lower,
    upper: lower + WAIT_TIME_UPPER_BUFFER_MINUTES,
  };
}
