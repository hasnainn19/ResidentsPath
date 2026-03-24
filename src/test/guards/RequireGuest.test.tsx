import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi, describe, it, expect, afterEach } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import RequireGuest from "../../guards/RequireGuest";
import { createMockAuth } from "./helpers";

vi.mock("../../hooks/useAuth");

const mockAuth = createMockAuth(vi.mocked(useAuth));

describe("RequireGuest", () => {

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });


    it("shows a loading spinner while auth is being checked", () => {
        mockAuth({ isLoading: true });

        render(
            <MemoryRouter>
                <RequireGuest><div>Auth Page</div></RequireGuest>
            </MemoryRouter>
        );

        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
    });

    it("renders children when not authenticated", () => {
        mockAuth({ isAuthenticated: false });

        render(
            <MemoryRouter>
                <RequireGuest><div>Auth Page</div></RequireGuest>
            </MemoryRouter>
        );

        expect(screen.getByText("Auth Page")).toBeInTheDocument();
    });

    it("redirects authenticated staff to /staff", () => {
        mockAuth({ isAuthenticated: true, isStaff: true });

        render(
            <MemoryRouter initialEntries={["/auth"]}>
                <Routes>
                    <Route path="/auth" element={
                        <RequireGuest><div>Auth Page</div></RequireGuest>
                    } />
                    <Route path="/staff" element={<div>Staff Dashboard</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Staff Dashboard")).toBeInTheDocument();
        expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
    });

    it("redirects authenticated resident to /form", () => {
        mockAuth({ isAuthenticated: true, isStaff: false });

        render(
            <MemoryRouter initialEntries={["/auth"]}>
                <Routes>
                    <Route path="/auth" element={
                        <RequireGuest><div>Auth Page</div></RequireGuest>
                    } />
                    <Route path="/form" element={<div>Form Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Form Page")).toBeInTheDocument();
        expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
    });

    it("redirects authenticated user back to the page they came from", () => {
        mockAuth({ isAuthenticated: true, isStaff: true });

        render(
            <MemoryRouter initialEntries={[{
                pathname: "/auth",
                state: { from: { pathname: "/dashboard" } },
            }]}>
                <Routes>
                    <Route path="/auth" element={
                        <RequireGuest><div>Auth Page</div></RequireGuest>
                    } />
                    <Route path="/dashboard" element={<div>Dashboard</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
    });

});
