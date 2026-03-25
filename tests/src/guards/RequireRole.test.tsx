import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi, describe, it, expect, afterEach } from "vitest";
import { useAuth } from "../../../src/hooks/useAuth";
import RequireRole from "../../../src/guards/RequireRole";
import { createMockAuth } from "./helpers";

vi.mock("../../../src/hooks/useAuth");

vi.mock("../../../src/pages/AccessDenied", () => ({
    default: () => <div>Access Denied</div>,
}));

const mockAuth = createMockAuth(vi.mocked(useAuth));

describe("RequireRole", () => {

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });


    it("shows a loading spinner while auth is being checked", () => {
        mockAuth({ isLoading: true });

        render(
            <MemoryRouter>
                <RequireRole allowedGroups={["Staff"]}><div>Protected</div></RequireRole>
            </MemoryRouter>
        );

        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        expect(screen.queryByText("Protected")).not.toBeInTheDocument();
    });

    it("redirects to /auth when not authenticated", () => {
        mockAuth({ isAuthenticated: false });

        render(
            <MemoryRouter initialEntries={["/protected"]}>
                <Routes>
                    <Route path="/protected" element={
                        <RequireRole allowedGroups={["Staff"]}><div>Protected</div></RequireRole>
                    } />
                    <Route path="/auth" element={<div>Auth Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Auth Page")).toBeInTheDocument();
        expect(screen.queryByText("Protected")).not.toBeInTheDocument();
    });

    it("shows access denied when authenticated but missing required group", () => {
        mockAuth({ isAuthenticated: true, groups: ["Residents"] });

        render(
            <MemoryRouter>
                <RequireRole allowedGroups={["Staff"]}><div>Protected</div></RequireRole>
            </MemoryRouter>
        );

        expect(screen.getByText("Access Denied")).toBeInTheDocument();
        expect(screen.queryByText("Protected")).not.toBeInTheDocument();
    });

    it("renders children when authenticated with a matching group", () => {
        mockAuth({ isAuthenticated: true, groups: ["Staff"] });

        render(
            <MemoryRouter>
                <RequireRole allowedGroups={["Staff"]}><div>Protected</div></RequireRole>
            </MemoryRouter>
        );

        expect(screen.getByText("Protected")).toBeInTheDocument();
    });

});
