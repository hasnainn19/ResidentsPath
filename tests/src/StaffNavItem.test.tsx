import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StaffNavItem from "../../src/components/StaffComponents/StaffNavItem";

const renderItem = (props?: Partial<{ icon: React.ReactNode; label: string; url: string }>) =>
  render(
    <MemoryRouter>
      <StaffNavItem
        icon={<DashboardIcon />}
        label="Dashboard"
        url="/staff"
        {...props}
      />
    </MemoryRouter>,
  );

describe("StaffNavItem", () => {
  it("renders the label", () => {
    renderItem();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders as a link with the given url", () => {
    renderItem({ url: "/staff/cases" });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/staff/cases");
  });

  it("renders a custom label", () => {
    renderItem({ label: "Case Management" });
    expect(screen.getByText("Case Management")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    const { container } = renderItem();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a single link element", () => {
    renderItem();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
