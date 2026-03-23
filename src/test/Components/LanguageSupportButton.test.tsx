import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LanguageSupportButton from "../../components/LanguageSupportButton";
import React from "react";


const changeLanguageMock = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: "en",
      changeLanguage: changeLanguageMock,
    },
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

    it("opens menu when button is clicked", () => {
        render(<LanguageSupportButton />);

        const button = screen.getByRole("button");
        fireEvent.click(button);

        expect(screen.getByText("English")).toBeInTheDocument();
        expect(screen.getByText("Polish")).toBeInTheDocument();
        expect(screen.getByText("Panjabi")).toBeInTheDocument();
    });

    it("calls changeLanguage when Polish language is clicked", () => {
        render(<LanguageSupportButton />);

        fireEvent.click(screen.getByRole("button"));
        fireEvent.click(screen.getByText("Polish"));

        expect(changeLanguageMock).toHaveBeenCalledWith("pl");
    });

    it("calls changeLanguage when English language is clicked", () => {
        render(<LanguageSupportButton />);

        fireEvent.click(screen.getByRole("button"));
        fireEvent.click(screen.getByText("English"));

        expect(changeLanguageMock).toHaveBeenCalledWith("en");
    });

    it("calls changeLanguage when Welsh language is clicked", () => {
        render(<LanguageSupportButton />);

        fireEvent.click(screen.getByRole("button"));
        fireEvent.click(screen.getByText("Welsh"));

        expect(changeLanguageMock).toHaveBeenCalledWith("cy");
    });

    it("calls changeLanguage when Panjabi language is clicked", () => {
        render(<LanguageSupportButton />);

        fireEvent.click(screen.getByRole("button"));
        fireEvent.click(screen.getByText("Panjabi"));

        expect(changeLanguageMock).toHaveBeenCalledWith("pa");
    });

    it("calls changeLanguage when Persian language is clicked", () => {
        render(<LanguageSupportButton />);

        fireEvent.click(screen.getByRole("button"));
        fireEvent.click(screen.getByText("Persian"));

        expect(changeLanguageMock).toHaveBeenCalledWith("fa");
    });

    it("marks current language as selected", () => {
        render(<LanguageSupportButton />);

        fireEvent.click(screen.getByRole("button"));

        const englishItem = screen.getByText("English").closest("li");
        expect(englishItem).toHaveClass("Mui-selected");
    });

    it("does not mark other languages as selected", () => {
        render(<LanguageSupportButton />);

        fireEvent.click(screen.getByRole("button"));

        const polishItem = screen.getByText("Polish").closest("li");
        expect(polishItem).not.toHaveAttribute("aria-selected", "true");
    });
});