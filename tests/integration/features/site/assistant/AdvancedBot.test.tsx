import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdvancedBot } from "@/features/site/assistant/AdvancedBot";
import { SITE_CONTACT } from "@/features/site/data/contact";

function openBot() {
  fireEvent.click(
    screen.getByRole("button", { name: /open whatsapp project assistant/i }),
  );
}

describe("AdvancedBot", () => {
  it("walks the intake flow and builds WhatsApp and email actions from the summary", () => {
    render(<AdvancedBot />);

    openBot();

    fireEvent.click(screen.getByRole("button", { name: "Workstations" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(screen.getByPlaceholderText("e.g. 12 workstations, 30 chairs"), {
      target: { value: "60 workstations" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(screen.getByPlaceholderText("Company name"), {
      target: { value: "Acme Corp" },
    });
    fireEvent.change(screen.getByPlaceholderText("City and state"), {
      target: { value: "Patna, Bihar" },
    });
    fireEvent.click(screen.getByRole("button", { name: "1–3 months" }));
    fireEvent.change(screen.getByLabelText("Your approximate budget"), {
      target: { value: "25 lakh" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "Email" }));
    fireEvent.change(screen.getByPlaceholderText("Your email address"), {
      target: { value: "anita@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(
      screen.getByPlaceholderText(
        "Optional details about layout, timelines, or brands.",
      ),
      { target: { value: "Need quick rollout support." } },
    );

    expect(
      screen.getByText(/Product family \/ project type: Workstations/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Company: Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/Timeline: 1–3 months/)).toBeInTheDocument();
    expect(screen.getByText(/Email: anita@example.com/)).toBeInTheDocument();

    const whatsappLink = screen.getByRole("link", { name: /send via whatsapp/i });
    const emailLink = screen.getByRole("link", { name: /send via email/i });

    expect(whatsappLink).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/919031022875?text="),
    );
    expect(whatsappLink).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("Acme Corp")),
    );
    expect(emailLink).toHaveAttribute(
      "href",
      expect.stringContaining(`mailto:${SITE_CONTACT.salesEmail}`),
    );
    expect(emailLink).toHaveAttribute(
      "href",
      expect.stringContaining("subject=One%26Only+workspace+enquiry+via+website+bot"),
    );
  });

  it("closes from step zero, toggles the launcher, and resets on step four", async () => {
    render(<AdvancedBot />);

    openBot();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByText(/Which product family/i)).not.toBeInTheDocument();
    });

    openBot();
    fireEvent.click(screen.getByRole("button", { name: "Acoustics" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. 12 workstations, 30 chairs"), {
      target: { value: "8 pods" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByPlaceholderText("e.g. 12 workstations, 30 chairs")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByPlaceholderText("Company name"), {
      target: { value: "Beta Ltd" },
    });
    fireEvent.change(screen.getByPlaceholderText("City and state"), {
      target: { value: "Delhi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ASAP (0–4 weeks)" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    fireEvent.change(
      screen.getByPlaceholderText("Your WhatsApp number with country code"),
      { target: { value: "+919888877777" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByText(/Which product family/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /open whatsapp project assistant/i }),
    );
    await waitFor(() => {
      expect(screen.queryByText(/Which product family/i)).not.toBeInTheDocument();
    });
  });

  it("covers alternate use cases, timelines, and the close header action", async () => {
    render(<AdvancedBot />);
    openBot();

    fireEvent.click(screen.getByRole("button", { name: "Meeting tables" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. 12 workstations, 30 chairs"), {
      target: { value: "4 tables" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByPlaceholderText("Company name"), {
      target: { value: "Gamma Inc" },
    });
    fireEvent.change(screen.getByPlaceholderText("City and state"), {
      target: { value: "Mumbai" },
    });
    fireEvent.click(screen.getByRole("button", { name: "3–6 months" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    fireEvent.change(
      screen.getByPlaceholderText("Your WhatsApp number with country code"),
      { target: { value: "+919111122222" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByText(/Product family \/ project type: Meeting and conference/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Timeline: 3–6 months/)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp: \+919111122222/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close chat assistant" }));
    await waitFor(() => {
      expect(screen.queryByText(/Meeting and conference/)).not.toBeInTheDocument();
    });
  });
});
