import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SectionCard from "../../components/StaffComponents/SectionCard";
import DetailRow from "../../components/StaffComponents/DetailRow";

describe("SectionCard", () => {
  it("renders the section title", () => {
    render(<SectionCard title="Resident Details">content</SectionCard>);
    expect(screen.getByText("Resident Details")).toBeInTheDocument();
  });

  it("renders its children", () => {
    render(
      <SectionCard title="Overview">
        <span>child content</span>
      </SectionCard>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <SectionCard title="Multi">
        <span>first</span>
        <span>second</span>
      </SectionCard>,
    );
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("renders a divider between the title and the content", () => {
    const { container } = render(
      <SectionCard title="Divider Test">body</SectionCard>,
    );
    expect(container.querySelector("hr")).toBeInTheDocument();
  });
});

describe("DetailRow inside SectionCard", () => {
  it("renders labelled rows correctly when composed inside a card", () => {
    render(
      <SectionCard title="Case Overview">
        <DetailRow label="Description" value="Needs housing support" />
        <DetailRow label="Status" value="IN PROGRESS" />
      </SectionCard>,
    );

    expect(screen.getByText("Case Overview")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Needs housing support")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
  });
});
