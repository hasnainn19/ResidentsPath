import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import StaffNavbar from "../../components/StaffComponents/StaffNavbar";

const mockAuthData: { givenName: string; familyName: string | null } = {
  givenName: "Jane",
  familyName: "Smith",
};

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockAuthData,
}));

vi.mock("aws-amplify/auth", () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <StaffNavbar />
    </MemoryRouter>,
  );

describe("StaffNavbar", () => {
  it("renders the app title", () => {
    renderNavbar();
    expect(screen.getByText("ResidentsPath")).toBeInTheDocument();
  });

  it("renders the 'staff view' subtitle", () => {
    renderNavbar();
    expect(screen.getByText("staff view")).toBeInTheDocument();
  });

  it("renders the authenticated user's full name", () => {
    renderNavbar();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    renderNavbar();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Manage Tickets")).toBeInTheDocument();
    expect(screen.getByText("Case Management")).toBeInTheDocument();
    expect(screen.getByText("User Dashboard")).toBeInTheDocument();
  });

  it("renders the Logout button", () => {
    renderNavbar();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls signOut when Logout is clicked", async () => {
    renderNavbar();
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  it("renders nav items as links with correct hrefs", () => {
    renderNavbar();
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/staff");
    expect(hrefs).toContain("/staff/queues");
    expect(hrefs).toContain("/staff/cases");
    expect(hrefs).toContain("/");
  });

  it("renders only the given name when familyName is null", () => {
    mockAuthData.familyName = null;
    renderNavbar();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    mockAuthData.familyName = "Smith";
  });

  it("logs an error when signOut throws", async () => {
    vi.mocked(signOut).mockRejectedValueOnce(new Error("auth error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderNavbar();
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error signing out:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });
});
