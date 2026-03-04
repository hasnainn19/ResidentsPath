
type EstimatedWaitingTimeProps = {
  departmentName: string;
};

const waitingTimes: Record<string, number> = {
  "Council_Tax": 50,
  "Housing_Benefit": 50,
  "Homelessness":100,
  "Adults_Duty":30,
  "Childrens_Duty":30,
  "Other":30
};

export default function EstimatedWaitingTime({departmentName}:EstimatedWaitingTimeProps) {
    return waitingTimes[departmentName] ?? 40;
}