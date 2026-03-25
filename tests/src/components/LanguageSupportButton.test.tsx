import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSupportButton from "../../../src/components/LanguageSupportButton";

const { changeLanguageMock } = vi.hoisted(() => ({
    changeLanguageMock: vi.fn(),
}));



vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        i18n: {
            language: "en",
            changeLanguage: changeLanguageMock,
        },
        t: (key: string) => key,
    }),
}));

describe("LanguageSupportButton", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders button with current language", () => {
        render(<LanguageSupportButton />);
        expect(screen.getByRole("button")).toHaveTextContent("EN");
    });

    it("opens menu when button is clicked", async () => {
        render(<LanguageSupportButton />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button"));

        expect(await screen.findByText("English")).toBeInTheDocument();
        expect(screen.getByText("Polish")).toBeInTheDocument();
        expect(screen.getByText("Panjabi")).toBeInTheDocument();
    });

    it("calls changeLanguage when Polish language is clicked", async () => {
        render(<LanguageSupportButton />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button"));
        await user.click(screen.getByText("Polish"));

        expect(changeLanguageMock).toHaveBeenCalledWith("pl");
    });

    it("calls changeLanguage when English language is clicked", async () => {
        render(<LanguageSupportButton />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button"));
        await user.click(screen.getByText("English"));

        expect(changeLanguageMock).toHaveBeenCalledWith("en");
    });

    it("calls changeLanguage when Welsh language is clicked", async () => {
        render(<LanguageSupportButton />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button"));
        await user.click(await screen.findByText("Welsh"));

        expect(changeLanguageMock).toHaveBeenCalledWith("cy");
    });

    it("calls changeLanguage when Panjabi language is clicked", async () => {
        render(<LanguageSupportButton />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button"));
        await user.click(screen.getByText("Panjabi"));

        expect(changeLanguageMock).toHaveBeenCalledWith("pa");
    });

    it("calls changeLanguage when Persian language is clicked", async () => {
        render(<LanguageSupportButton />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button"));
        await user.click(await screen.findByText("Persian"));

        expect(changeLanguageMock).toHaveBeenCalledWith("fa");
    });

    it("marks current language as selected", async () => {
        render(<LanguageSupportButton />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button"));

        const englishItem = await screen.findByText("English");
        expect(englishItem).toHaveClass("Mui-selected");
    });

    it("does not mark other languages as selected", async () => {
        render(<LanguageSupportButton />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button"));

        const polishItem = screen.getByText("Polish");
        expect(polishItem.closest("li")).not.toHaveAttribute("aria-selected", "true");
    });
});