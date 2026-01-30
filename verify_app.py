from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to Dashboard...")
        try:
            page.goto("http://localhost:4173/")

            # Wait for dashboard to load (look for "Command Center")
            page.wait_for_selector("text=Command Center", timeout=10000)
            print("Dashboard loaded.")

            page.screenshot(path="verification_dashboard.png")
            print("Dashboard screenshot taken.")

            # Navigate to Nutrients
            print("Navigating to Nutrients...")
            page.click("text=Nutrients")

            # Wait for Nutrient List to load
            page.wait_for_selector("text=Nutrient Inventory", timeout=10000)
            print("Nutrient List loaded.")

            page.screenshot(path="verification_nutrients.png")
            print("Nutrient List screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
