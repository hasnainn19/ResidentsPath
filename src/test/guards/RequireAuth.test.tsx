import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi, describe, it, expect, afterEach } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import RequireAuth from "../../guards/RequireAuth";
import { createMockAuth } from "./helpers";

vi.mock("../../hooks/useAuth");

const mockAuth = createMockAuth(vi.mocked(useAuth));

describe("RequireAuth", () => {

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });


    it("shows a loading spinner while auth is being checked", () => {
        mockAuth({ isLoading: true });

        render(
            <MemoryRouter>
                <RequireAuth><div>Protected</div></RequireAuth>
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
                        <RequireAuth><div>Protected</div></RequireAuth>
                    } />
                    <Route path="/auth" element={<div>Auth Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Auth Page")).toBeInTheDocument();
        expect(screen.queryByText("Protected")).not.toBeInTheDocument();
    });

    it("renders children when authenticated", () => {
        mockAuth({ isAuthenticated: true });

        render(
            <MemoryRouter>
                <RequireAuth><div>Protected</div></RequireAuth>
            </MemoryRouter>
        );

        expect(screen.getByText("Protected")).toBeInTheDocument();
    });

});
