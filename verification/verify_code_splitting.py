from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_code_splitting(page: Page):
    print("Navigating to home page...")
    page.goto("http://localhost:3000")

    print("Waiting for Dashboard to load...")
    expect(page.get_by_text("Command Center")).to_be_visible(timeout=10000)

    print("Taking screenshot of Dashboard...")
    page.screenshot(path="verification/dashboard.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_code_splitting(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
