from playwright.sync_api import sync_playwright
import time

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000")

            # Wait for "Command Center" (Dashboard title)
            page.wait_for_selector("text=Command Center", timeout=20000)
            print("Loaded Dashboard")

            # Screenshot Dashboard
            page.screenshot(path="verification/dashboard.png")

            # Click "Nutrients" in the sidebar
            print("Clicking Nutrients")
            # There might be multiple "Nutrients" text (one in sidebar, one in dashboard stats?)
            # Use specific locator for sidebar link
            page.click("button:has-text('Nutrients')")

            # Wait a bit for lazy load
            time.sleep(3)

            # Screenshot Nutrients
            page.screenshot(path="verification/nutrients.png")
            print("Taken screenshots")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
