import { describe, it, expect, vi } from "vitest";
import { myFunction } from "../src/main";
import { showConfirmationDialog } from "../src/ui/confirmation";

vi.mock("../src/ui/confirmation", () => ({
  showConfirmationDialog: vi.fn(),
}));

describe("myFunction", () => {
  it("確認ダイアログを表示する", () => {
    myFunction();

    expect(showConfirmationDialog).toHaveBeenCalledTimes(1);
  });
});
