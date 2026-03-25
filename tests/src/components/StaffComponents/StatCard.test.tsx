import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PeopleIcon from "@mui/icons-material/People";
import StatCard from "../../../../src/components/StaffComponents/StatCard";

describe("StatCard", () => {
  it("renders a numeric value", () => {
    render(<StatCard icon={PeopleIcon} value={42} label="Waiting" />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders a string value", () => {
    render(<StatCard icon={PeopleIcon} value="N/A" label="Staff Available" />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders the label", () => {
    render(<StatCard icon={PeopleIcon} value={10} label="Active Cases" />);
    expect(screen.getByText("Active Cases")).toBeInTheDocument();
  });

  it("renders the icon inside an avatar", () => {
    const { container } = render(
      <StatCard icon={PeopleIcon} value={5} label="Total" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders both value and label together", () => {
    render(<StatCard icon={PeopleIcon} value={7} label="Priority Cases" />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Priority Cases")).toBeInTheDocument();
  });
});
