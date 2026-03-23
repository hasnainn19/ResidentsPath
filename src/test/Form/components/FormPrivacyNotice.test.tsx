import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FormPrivacyNotice from "../../../components/FormPageComponents/FormPrivacyNotice";

describe("FormPrivacyNotice", () => {
  it("opens and closes the full privacy notice dialog", async () => {
    render(<FormPrivacyNotice />);
    const user = userEvent.setup();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Read the full privacy notice" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Privacy Notice")[0]).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
